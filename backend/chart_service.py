"""POPO server calculation boundary (Stage 3 — unverified candidate probe).

The trusted Agent tool intentionally remains unavailable. A separate local-only
endpoint invokes the existing pinned lunar-javascript engine through Node.js.
Nothing from this probe may be promoted to a verified personal chart or Agent.
"""
import json
import re
import shutil
import subprocess
from datetime import date, datetime
from pathlib import Path
from typing import Any

BRIDGE_SCRIPT = Path(__file__).with_name("chart_bridge.cjs")
EXPECTED_ENGINE = "lunar-javascript@1.7.7"
KEYS = ("wood", "fire", "earth", "metal", "water")
PILLAR = re.compile(r"^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$")


class ChartProbeError(Exception):
    """Public-safe category for an invalid or unavailable chart probe."""

    def __init__(self, message: str, status_code: int = 422):
        self.status_code = status_code
        super().__init__(message)


def get_saju_chart() -> dict[str, Any]:
    """Keep the LLM tool closed until independent Korean four-pillar QA passes."""
    return {
        "status": "unavailable",
        "verified": False,
        "message": "사주 계산 후보는 있지만 한국 기준 정확성 검증이 아직 끝나지 않았어. 그래서 지금은 개인 명식을 확정해서 풀이할 수 없어.",
        "pillars": None,
        "engine_version": None,
    }


def validate_probe_input(source: dict[str, Any]) -> dict[str, Any]:
    """Server-side independent restrictions; do not trust JS validation alone."""
    if type(source) is not dict:
        raise ChartProbeError("입력 형식이 잘못되었습니다.")
    if set(source) != {"calendar", "date", "time", "place", "unknownTime"}:
        raise ChartProbeError("필수 출생 정보만 입력해 주세요.")
    if source["calendar"] != "양력":
        raise ChartProbeError("현재 계산 후보는 양력 입력만 지원합니다.")
    if source["place"] not in ("서울", "부산", "대전"):
        raise ChartProbeError("현재 시험은 서울·부산·대전만 지원합니다.")
    if source["unknownTime"] is not False:
        raise ChartProbeError("출생 시각을 모르면 현재 계산 시험을 지원하지 않습니다.")
    date_text, time_text = source["date"], source["time"]
    if type(date_text) is not str or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_text):
        raise ChartProbeError("날짜는 YYYY-MM-DD로 입력해 주세요.")
    try:
        d = date.fromisoformat(date_text)
    except ValueError as exc:
        raise ChartProbeError("존재하지 않는 날짜입니다.") from exc
    if not (1990 <= d.year <= 2040):
        raise ChartProbeError("현재 기술 시험 지원 범위는 1990~2040년입니다.")
    if 3 <= d.day <= 9:
        raise ChartProbeError("절기 경계 시험은 아직 지원하지 않습니다(매월 3~9일).")
    if type(time_text) is not str or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", time_text):
        raise ChartProbeError("시간은 HH:mm으로 입력해 주세요.")
    hour = int(time_text[:2])
    if hour in (0, 23):
        raise ChartProbeError("자시 날짜 경계(23:00~00:59)는 검증 후 지원합니다.")
    return source.copy()


def _validate_bridge_result(result: Any) -> dict[str, Any]:
    if not isinstance(result, dict):
        raise ChartProbeError("계산 결과를 확인할 수 없습니다.", 503)
    if result.get("verified") is not False or result.get("status") != "candidate_only":
        raise ChartProbeError("검증되지 않은 계산 결과 상태입니다.", 503)
    if result.get("can_personalize") is not False or result.get("engine") != EXPECTED_ENGINE:
        raise ChartProbeError("계산 엔진의 출력 상태가 올바르지 않습니다.", 503)
    pillars = result.get("pillars")
    counts = result.get("counts")
    if (not isinstance(pillars, dict) or set(pillars) != {"year", "month", "day", "hour"}
            or not all(isinstance(value, str) and PILLAR.fullmatch(value) for value in pillars.values())):
        raise ChartProbeError("계산된 네 기둥의 형식이 올바르지 않습니다.", 503)
    if (not isinstance(counts, dict) or set(counts) != set(KEYS)
            or any(type(counts[k]) is not int or counts[k] < 0 or counts[k] > 8 for k in KEYS)
            or sum(counts.values()) != 8):
        raise ChartProbeError("오행 계산 결과가 올바르지 않습니다.", 503)
    # Do not trust mutable runtime strings blindly in the API contract.
    return {
        "status": "candidate_only", "verified": False, "can_personalize": False,
        "pillars": pillars, "counts": counts, "engine": EXPECTED_ENGINE,
        "probe_version": "POPO-CHART-PROBE-STAGE3-2026-11-02",
        "policy": "KST 기준 연·월주 절기 조회만 -60분; 일·시주는 원본 KST 사용",
        "limitations": "한국 만세력 전체 교차 검증 전. 개인 명식·AI 개인화에 사용 불가.",
    }


def calculate_probe(source: dict[str, Any]) -> dict[str, Any]:
    """Synchronous localhost-only calculation via pinned repo JS, no persistence."""
    data = validate_probe_input(source)
    node = shutil.which("node")
    if not node or not BRIDGE_SCRIPT.is_file():
        raise ChartProbeError("로컬 계산 실행 환경(Node.js)이 준비되지 않았습니다.", 503)
    try:
        finished = subprocess.run(
            [node, str(BRIDGE_SCRIPT)],
            input=json.dumps(data, ensure_ascii=False),
            capture_output=True, encoding="utf-8", timeout=4, check=False,
            shell=False,
        )
    except (subprocess.TimeoutExpired, OSError) as exc:
        raise ChartProbeError("로컬 계산 엔진을 실행하지 못했습니다.", 503) from exc
    if finished.returncode != 0 or len(finished.stdout) > 4096:
        raise ChartProbeError("계산 후보가 결과를 생성하지 못했습니다.", 503)
    try:
        parsed = json.loads(finished.stdout)
    except (json.JSONDecodeError, ValueError) as exc:
        raise ChartProbeError("계산 엔진 응답을 확인할 수 없습니다.", 503) from exc
    return _validate_bridge_result(parsed)
