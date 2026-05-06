LEVEL_GUIDANCE: dict[str, str] = {
    "junior": (
        "Calibrate expectations for junior level: value core concepts, basic correctness, "
        "clear thinking, and ability to explain trade-offs at a simple level."
    ),
    "middle": (
        "Calibrate expectations for middle level: expect confident practical knowledge, "
        "solid reasoning, and awareness of common production pitfalls."
    ),
    "senior": (
        "Calibrate expectations for senior level: expect deep system thinking, strong "
        "trade-off analysis, production-grade patterns, and leadership-level communication."
    ),
}

INTERVIEW_TYPE_GUIDANCE: dict[str, str] = {
    "technical": (
        "Focus mostly on technical correctness, architecture thinking, and implementation details."
    ),
    "hr": (
        "This is an HR interview. Focus on communication, ownership, teamwork, conflict handling, "
        "motivation, and behavioral maturity. Penalize irrelevant deep technical judging."
    ),
    "mixed": (
        "Balance technical signal with communication and behavioral signal."
    ),
}


def get_level_guidance(level: str) -> str:
    return LEVEL_GUIDANCE.get(level.strip().lower())


def get_interview_type_guidance(interview_type: str) -> str:
    return INTERVIEW_TYPE_GUIDANCE.get(interview_type.strip().lower())
