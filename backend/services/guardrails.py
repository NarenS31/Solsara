# guardrails check if a review contains anything risky
# that should not be auto-posted and needs human review instead

# keywords that indicate legal, health, or safety issues
HOLD_KEYWORDS = [
    # health and safety
    "food poisoning", "sick", "ill", "hospital", "ambulance",
    "allergic reaction", "allergy", "contaminated", "health department",
    "health hazard", "injured", "injury", "hurt", "accident",
    # legal threats
    "lawyer", "attorney", "lawsuit", "sue", "legal action",
    "court", "police", "report you", "authorities",
    # discrimination
    "racist", "racism", "discrimination", "discriminate",
    "sexist", "harassment", "harassed",
    # serious complaints
    "roach", "cockroach", "rat", "rodent", "pest",
    "mold", "mould", "expired", "rotten"
]


def check_guardrails(response_text: str, review_text: str) -> dict:
    # checks both the original review and the generated response
    # for anything that should be held for human review
    combined_text = (review_text + " " + response_text).lower()

    for keyword in HOLD_KEYWORDS:
        if keyword in combined_text:
            return {
                "flagged": True,
                "reason": f"Contains sensitive keyword: '{keyword}'"
            }

    return {
        "flagged": False,
        "reason": None
    }