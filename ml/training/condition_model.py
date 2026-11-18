"""
Kabadiwala Connect AI - Standalone Condition Assessment Engine
==============================================================
Heuristic & Rule-Based Supervised Expert Evaluator
"""

import re
from typing import Dict, Any, List

class ConditionAssessor:
    """
    Evaluates physical condition and recycling suitability based on multi-factor telemetry:
    - Operational functionality
    - Mechanical/structural wear
    - Component completeness
    - Keyword parsing of observed damage
    """

    DAMAGE_KEYWORDS = {
        'broken': -1.5,
        'cracked': -1.2,
        'shattered': -2.0,
        'damaged': -1.0,
        'burnt': -2.5,
        'smoke': -2.0,
        'water': -2.0,
        'liquid': -1.5,
        'corroded': -1.5,
        'rust': -1.0,
        'dent': -0.5,
        'scratched': -0.3
    }

    POSITIVE_KEYWORDS = {
        'clean': 0.8,
        'mint': 1.5,
        'working': 1.0,
        'good': 0.8,
        'like new': 1.5,
        'boxed': 1.0,
        'sealed': 1.5
    }

    @classmethod
    def assess(
        cls,
        category_slug: str,
        age_years: float,
        functionality: str,
        condition_input_text: str = "",
        missing_components: int = 0,
        observations: str = ""
    ) -> Dict[str, Any]:
        score = 5.0  # Base neutral score
        reasoning: List[str] = []

        # 1. Functionality Analysis
        if functionality == 'working':
            score += 2.5
            reasoning.append("Device is fully functional (+2.5)")
        elif functionality == 'partial':
            score += 0.5
            reasoning.append("Device retains partial functionality (+0.5)")
        else:
            score -= 2.0
            reasoning.append("Device is non-functional / dead (-2.0)")

        # 2. Age Depreciation
        if age_years <= 2:
            score += 1.0
            reasoning.append(f"Recent device generation ({age_years} yrs) (+1.0)")
        elif age_years > 8:
            score -= 2.0
            reasoning.append(f"Significant technological obsolescence ({age_years} yrs) (-2.0)")
        elif age_years > 5:
            score -= 1.0
            reasoning.append(f"Moderate age depreciation ({age_years} yrs) (-1.0)")

        # 3. Missing Components
        if missing_components > 0:
            penalty = min(3.0, missing_components * 0.8)
            score -= penalty
            reasoning.append(f"{missing_components} critical component(s) missing (-{penalty:.1f})")

        # 4. Text Heuristics from input & observations
        combined_text = f"{condition_input_text} {observations}".lower()
        for kw, delta in cls.DAMAGE_KEYWORDS.items():
            if re.search(r'\b' + re.escape(kw) + r'\b', combined_text):
                score += delta
                reasoning.append(f"Detected damage keyword '{kw}' ({delta:.1f})")

        for kw, delta in cls.POSITIVE_KEYWORDS.items():
            if re.search(r'\b' + re.escape(kw) + r'\b', combined_text):
                score += delta
                reasoning.append(f"Detected positive condition keyword '{kw}' (+{delta:.1f})")

        # Clamp score between 0.0 and 10.0
        final_score = round(max(0.0, min(10.0, score)), 1)

        # Categorize condition label
        if final_score >= 8.0:
            condition = "excellent"
            action = "High potential for refurbishing, resale, or institutional donation."
        elif final_score >= 6.0:
            condition = "good"
            action = "Suitable for repair or spare parts harvesting."
        elif final_score >= 4.0:
            condition = "fair"
            action = "Component extraction (RAM, display, copper coils) recommended."
        elif final_score >= 2.0:
            condition = "poor"
            action = "Material recovery and shredding for copper, plastics, and precious metals."
        else:
            condition = "non_functional"
            action = "Direct specialized e-waste decontamination and slag smelting."

        return {
            "category": category_slug,
            "condition": condition,
            "condition_score": final_score,
            "reasoning": reasoning,
            "recommended_action": action,
            "disclaimer": "This is an AI-assisted heuristic assessment, not a certified structural engineering verdict."
        }

if __name__ == "__main__":
    test_result = ConditionAssessor.assess(
        category_slug="laptop",
        age_years=3.5,
        functionality="partial",
        condition_input_text="screen working but keyboard cracked",
        missing_components=1
    )
    print("Condition Assessor Demo Output:")
    print(test_result)
