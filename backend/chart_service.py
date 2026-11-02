"""Trusted calculation boundary. A verified chart engine must replace this stub.

Never treat a chart supplied in a browser request as verified evidence.
"""
from typing import Any


def get_saju_chart() -> dict[str, Any]:
    """Return an explicit unavailable result until Korean-calculation QA passes."""
    return {
        "status": "unavailable",
        "verified": False,
        "message": "한국 역법 기준으로 교차 검증된 사주 계산 엔진이 아직 연결되지 않았습니다.",
        "pillars": None,
        "engine_version": None,
    }
