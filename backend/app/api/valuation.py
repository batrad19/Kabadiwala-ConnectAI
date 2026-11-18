"""Pricing / Valuation service and API router."""
from __future__ import annotations
import logging
from pathlib import Path
from typing import Optional, Any
import joblib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.deps import get_db, get_current_active_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# Base prices (INR/kg) — DEMONSTRATION DATA — clearly labeled
_BASE_PRICES: dict[str, tuple[float, float]] = {
    "laptop":          (200.0, 450.0),
    "mobile_phone":    (100.0, 350.0),
    "battery":         (20.0,  80.0),
    "keyboard":        (30.0,  80.0),
    "mouse":           (20.0,  60.0),
    "pcb":             (300.0, 800.0),
    "monitor":         (40.0,  120.0),
    "printer":         (30.0,  100.0),
    "television":      (25.0,  90.0),
    "cables":          (40.0,  100.0),
    "charger_adapter": (50.0,  150.0),
    "other_ewaste":    (20.0,  60.0),
}

_CONDITION_MULTIPLIERS = {
    "reusable": 1.4,
    "excellent": 1.3,
    "good": 1.1,
    "fair": 0.85,
    "repairable": 1.1,
    "poor": 0.6,
    "damaged": 0.7,
    "non_functional": 0.4,
    "material_recovery": 0.5,
    "manual_inspection": 0.9,
}

_AGE_MULTIPLIERS = {
    (0, 2): 1.3,
    (2, 5): 1.0,
    (5, 8): 0.75,
    (8, 100): 0.5,
}

_REGION_MULTIPLIERS = {
    "metro": 1.1,
    "tier1": 1.0,
    "tier2": 0.9,
    "tier3": 0.75,
}


class ValuationRequest(BaseModel):
    category_slug: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    weight_kg: float = 1.0
    age_years: Optional[float] = None
    condition: str = "manual_inspection"
    functionality: str = "non_working"
    missing_components: int = 0
    region: str = "tier1"


class ValuationResponse(BaseModel):
    estimated_min: float
    estimated_max: float
    estimated_value: float
    price_min: float
    price_max: float
    price_expected: float
    price_per_kg_min: float
    price_per_kg_max: float
    currency: str = "INR"
    unit: str = "INR"
    factors: list[Any]
    model_used: str
    data_disclaimer: str
    pricing_date: str


def _get_age_multiplier(age: Optional[float]) -> float:
    if age is None:
        return 1.0
    for (lo, hi), mult in _AGE_MULTIPLIERS.items():
        if lo <= age < hi:
            return mult
    return 0.5


class PricingService:
    def __init__(self):
        self.ml_model = None
        self._load_ml_model()

    def _load_ml_model(self):
        candidates = [
            Path(__file__).parent.parent.parent / "ml" / "saved_models" / "pricing_model.pkl",
            Path("../ml/saved_models/pricing_model.pkl"),
            Path("ml/saved_models/pricing_model.pkl"),
        ]
        for p in candidates:
            if p.exists():
                try:
                    self.ml_model = joblib.load(p)
                    logger.info("✅ Pricing ML Random Forest model loaded from %s via joblib.", p)
                    break
                except Exception as e:
                    logger.warning("Could not load pricing ML model from %s: %s", p, e)

    def estimate(self, req: ValuationRequest) -> ValuationResponse:
        from datetime import date

        cat = (req.category_slug or req.category or "other_ewaste").lower()
        base_min, base_max = _BASE_PRICES.get(cat, (20.0, 100.0))
        condition_mult = _CONDITION_MULTIPLIERS.get(req.condition.lower(), 0.9)
        age_mult = _get_age_multiplier(req.age_years)
        region_mult = _REGION_MULTIPLIERS.get(req.region.lower(), 1.0)
        missing_penalty = max(0.0, 1.0 - 0.08 * req.missing_components)
        func_mult = 1.2 if req.functionality == "working" else (0.85 if req.functionality == "partial" else 0.6)

        final_min = base_min * condition_mult * age_mult * region_mult * missing_penalty * func_mult
        final_max = base_max * condition_mult * age_mult * region_mult * missing_penalty * func_mult

        price_min = round(final_min * req.weight_kg, 2)
        price_max = round(final_max * req.weight_kg, 2)
        price_expected = round((price_min + price_max) / 2, 2)

        # Apply trained Random Forest Regressor when available
        if self.ml_model:
            try:
                cat_list = [
                    'battery', 'cables', 'charger_adapter', 'keyboard', 'laptop',
                    'mobile_phone', 'monitor', 'mouse', 'other_ewaste', 'pcb', 'printer', 'television'
                ]
                cat_idx = cat_list.index(cat) if cat in cat_list else 8
                brand_tier = 1 if req.brand else 0
                age_val = float(req.age_years) if req.age_years is not None else 3.0
                cond_map = {
                    "reusable": 5, "excellent": 5, "good": 4, "fair": 3,
                    "repairable": 3, "poor": 2, "damaged": 2,
                    "non_functional": 1, "material_recovery": 1, "manual_inspection": 3
                }
                cond_score = cond_map.get(req.condition.lower(), 3)
                func_score = 2 if req.functionality == "working" else (1 if req.functionality == "partial" else 0)
                reg_map = {"metro": 0, "tier1": 1, "tier2": 2, "tier3": 3}
                reg_tier = reg_map.get(req.region.lower(), 1)

                feat_vec = [[cat_idx, brand_tier, float(req.weight_kg), age_val, cond_score, func_score, int(req.missing_components), reg_tier]]
                ml_pred_val = float(self.ml_model.predict(feat_vec)[0])
                if ml_pred_val > 10.0:
                    price_expected = round(ml_pred_val, 2)
                    price_min = round(max(15.0, price_expected * 0.85), 2)
                    price_max = round(price_expected * 1.20, 2)
            except Exception as exc:
                logger.warning("ML inference fallback to formula: %s", exc)

        factors = [
            {"factor": "Category base price", "value": f"₹{base_min}–₹{base_max}/kg", "impact": "baseline"},
            {"factor": "Condition multiplier", "value": f"{condition_mult:.2f}×", "impact": "positive" if condition_mult >= 1.0 else "negative"},
            {"factor": "Device age", "value": f"{req.age_years or 'Unknown'} years ({age_mult:.2f}×)", "impact": "positive" if age_mult >= 1.0 else "negative"},
            {"factor": "Region", "value": f"{req.region} ({region_mult:.2f}×)", "impact": "neutral"},
            {"factor": "Missing components", "value": f"{req.missing_components} ({missing_penalty:.2f}×)", "impact": "negative" if req.missing_components > 0 else "neutral"},
            {"factor": "Functionality", "value": f"{req.functionality} ({func_mult:.2f}×)", "impact": "positive" if func_mult >= 1.0 else "negative"},
            {"factor": "Weight", "value": f"{req.weight_kg} kg", "impact": "neutral"},
        ]

        model_used = "ml_regression_random_forest" if self.ml_model else "rule_based_demonstration"

        return ValuationResponse(
            estimated_min=price_min,
            estimated_max=price_max,
            estimated_value=price_expected,
            price_min=price_min,
            price_max=price_max,
            price_expected=price_expected,
            currency="INR",
            unit="INR",
            price_per_kg_min=round(price_min / max(0.01, req.weight_kg), 2),
            price_per_kg_max=round(price_max / max(0.01, req.weight_kg), 2),
            factors=factors,
            model_used=model_used,
            data_disclaimer=(
                "IMPORTANT: These are indicative estimates based on "
                "DEMONSTRATION DATA. Actual market prices vary. "
                "Get quotes from verified recyclers for accurate pricing."
            ),
            pricing_date=str(date.today()),
        )


pricing_service = PricingService()


@router.post("/estimate", response_model=ValuationResponse)
def estimate_price(
    payload: ValuationRequest,
):
    """
    Estimate the indicative market value of e-waste.
    Returns price range, factors, and clear disclaimer about data nature.
    Open endpoint accessible to all platform users and visitors.
    """
    if payload.weight_kg <= 0:
        raise HTTPException(status_code=422, detail="Weight must be positive.")
    return pricing_service.estimate(payload)
