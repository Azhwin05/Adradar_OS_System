def calculate_score(lead_data: dict) -> tuple[int, str]:
    """
    Score a lead 0-100 based on available signals.
    Called at upload time; result stored on lead record.
    """
    score = 0

    # Contact quality (40 points max)
    if lead_data.get("contact_email"):
        score += 20
    if lead_data.get("contact_linkedin"):
        score += 10
    if lead_data.get("contact_phone"):
        score += 5
    if lead_data.get("verified_email"):
        score += 5

    # Decision maker seniority (30 points max)
    title = (lead_data.get("contact_title") or "").lower()
    if any(t in title for t in ["ceo", "founder", "owner", "director"]):
        score += 30
    elif any(t in title for t in ["vp", "head", "chief", "president"]):
        score += 20
    elif any(t in title for t in ["manager", "lead", "senior"]):
        score += 10

    # Ad activity signals (20 points max)
    if lead_data.get("ad_spend_signal"):
        score += 15
    if lead_data.get("pain_signals"):
        score += 5

    # Hiring triggers (10 points max)
    if lead_data.get("hiring_triggers"):
        score += 10

    # Tier classification
    if score >= 80:
        tier = "hot"
    elif score >= 60:
        tier = "warm"
    else:
        tier = "review"

    return score, tier


def classify_role_bucket(title: str | None) -> str | None:
    """Map a contact title to a role bucket."""
    if not title:
        return None
    t = title.lower()
    if any(k in t for k in ["founder", "ceo", "owner", "president", "co-founder"]):
        return "Founder"
    if any(k in t for k in ["marketing", "growth", "demand", "brand", "content"]):
        return "Marketing"
    if any(k in t for k in ["media", "paid", "ppc", "performance", "acquisition"]):
        return "Growth"
    return None
