"""Condition assessment API router."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.deps import get_db, get_current_active_user
from app.models.user import User

router = APIRouter()


class ConditionRequest(BaseModel):
    category_slug: str
    age_years: Optional[float] = None
    functionality: str = "non_working"
    condition_input: str = "unknown"
    missing_components: int = 0
    user_observations: str = ""
    brand: Optional[str] = None


CONDITIONS = ["reusable", "repairable", "damaged", "material_recovery", "manual_inspection"]

ACTIONS = {
    "reusable": "This device can be refurbished and resold. Consider contacting a refurbishment centre.",
    "repairable": "With minor repairs, this device can be reused. Contact a repair shop or recycler accepting repairable items.",
    "damaged": "This device has significant damage. Contact a certified e-waste recycler for safe disposal.",
    "material_recovery": "Valuable materials can be recovered from this device. Contact an authorised material recycler.",
    "manual_inspection": "A trained technician should physically inspect this device to determine its best disposal path.",
}


def _rule_based_assess(req: ConditionRequest) -> dict:
    """
    Rule-based condition assessment.
    NOTE: This is a heuristic system. Physical inspection by a trained 
    professional is required for accurate assessment.
    """
    reasoning = []
    score = 0  # higher = better condition

    if req.functionality == "working":
        score += 3
        reasoning.append("Device is reported as fully functional (+).")
    elif req.functionality == "partial":
        score += 1
        reasoning.append("Device has partial functionality (neutral).")
    else:
        score -= 1
        reasoning.append("Device is non-functional (-).")

    age = req.age_years or 5
    if age < 2:
        score += 2
        reasoning.append(f"Device is relatively new ({age:.1f} years) (+).")
    elif age < 5:
        score += 1
        reasoning.append(f"Device is moderately aged ({age:.1f} years) (neutral).")
    elif age < 10:
        reasoning.append(f"Device is older ({age:.1f} years) (-).")
    else:
        score -= 1
        reasoning.append(f"Device is quite old ({age:.1f} years) (--).")

    if req.missing_components == 0:
        score += 1
        reasoning.append("No components reported missing (+).")
    elif req.missing_components <= 2:
        reasoning.append(f"{req.missing_components} component(s) missing (-).")
    else:
        score -= 2
        reasoning.append(f"Multiple components missing ({req.missing_components}) (--).")

    if req.user_observations and any(w in req.user_observations.lower() for w in ["crack", "broken", "burn", "damage", "shatter"]):
        score -= 2
        reasoning.append("User reported physical damage (--).")

    # Map score to condition
    if score >= 5:
        condition = "reusable"
        confidence = 0.78
    elif score >= 3:
        condition = "repairable"
        confidence = 0.72
    elif score >= 1:
        condition = "damaged"
        confidence = 0.68
    elif score >= -1:
        condition = "material_recovery"
        confidence = 0.65
    else:
        condition = "manual_inspection"
        confidence = 0.55

    return {
        "condition_category": condition,
        "confidence": confidence,
        "assessment_method": "rule_based",
        "reasoning": reasoning,
        "recommended_action": ACTIONS[condition],
        "disclaimer": (
            "This assessment is based on reported information only. "
            "Physical inspection by a qualified technician is required "
            "to confirm condition, especially for batteries and high-value components."
        ),
    }


@router.post("/assess")
def assess_condition(
    payload: ConditionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Assess e-waste condition using a hybrid rule-based system.
    Returns condition category, reasoning, and recommended action.
    """
    return _rule_based_assess(payload)
