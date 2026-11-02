"""POPO Stage 3 tests: offline bridge/contract, NOT Korean four-pillar certification.

These tests never call the real pinned lunar library and never call the LLM.
Run the separate Node integration script after applying to the real repo.
"""
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import chart_service
import main

INPUT = {"calendar": "양력", "date": "2000-01-01", "time": "12:00", "place": "서울", "unknownTime": False}
EXPECTED = {
    "status": "candidate_only", "verified": False, "can_personalize": False,
    "pillars": {"year": "己卯", "month": "丙子", "day": "戊午", "hour": "戊午"},
    "counts": {"wood": 1, "fire": 3, "earth": 3, "metal": 0, "water": 1},
    "engine": "lunar-javascript@1.7.7"
}


class ChartProbeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_01_service_tool_is_still_closed(self):
        response = chart_service.get_saju_chart()
        self.assertFalse(response["verified"])
        self.assertIsNone(response["pillars"])

    def test_02_input_restrictions_solar_date_and_hour(self):
        self.assertEqual(chart_service.validate_probe_input(INPUT), INPUT)
        for patch_data in (
            {"calendar": "음력"}, {"date": "2000-01-05"},
            {"date": "2000-02-30"}, {"date": "1989-01-01"},
            {"date": "2041-01-01"}, {"time": "23:30"},
            {"time": "00:10"}, {"time": "99:00"},
            {"place": "제주"}, {"unknownTime": True},
        ):
            with self.subTest(patch_data=patch_data):
                with self.assertRaises(chart_service.ChartProbeError):
                    chart_service.validate_probe_input({**INPUT, **patch_data})

    def test_03_unknown_fields_rejected(self):
        with self.assertRaises(chart_service.ChartProbeError):
            chart_service.validate_probe_input({**INPUT, "pillars": {"year": "偽"}})

    def test_04_malformed_engine_result_rejected(self):
        for change in (
            {"verified": True}, {"status": "verified"},
            {"can_personalize": True}, {"engine": "untrusted"},
            {"pillars": {**EXPECTED["pillars"], "day": "??"}},
            {"counts": {**EXPECTED["counts"], "fire": 4}},
            {"counts": {**EXPECTED["counts"], "earth": True}},
        ):
            with self.subTest(change=change):
                with self.assertRaises(chart_service.ChartProbeError):
                    chart_service._validate_bridge_result({**EXPECTED, **change})

    def test_05_valid_engine_candidate_remains_unverified(self):
        result = chart_service._validate_bridge_result(EXPECTED)
        self.assertEqual(result["status"], "candidate_only")
        self.assertFalse(result["verified"])
        self.assertFalse(result["can_personalize"])
        self.assertNotIn("chart_id", result)

    def test_06_subprocess_safe_args_no_shell(self):
        fake = SimpleNamespace(returncode=0, stdout=json.dumps(EXPECTED))
        with patch.object(chart_service.shutil, "which", return_value="/usr/bin/node"), \
             patch.object(chart_service.BRIDGE_SCRIPT.__class__, "is_file", return_value=True), \
             patch.object(chart_service.subprocess, "run", return_value=fake) as run:
            result = chart_service.calculate_probe(INPUT)
        self.assertFalse(result["verified"])
        self.assertFalse(run.call_args.kwargs["shell"])
        self.assertEqual(run.call_args.args[0][0], "/usr/bin/node")
        self.assertEqual(json.loads(run.call_args.kwargs["input"]), INPUT)
        self.assertEqual(run.call_args.kwargs["timeout"], 4)

    def test_07_missing_node_returns_503(self):
        with patch.object(chart_service.shutil, "which", return_value=None):
            with self.assertRaises(chart_service.ChartProbeError) as cm:
                chart_service.calculate_probe(INPUT)
        self.assertEqual(cm.exception.status_code, 503)

    def test_08_api_endpoint_with_mock_candidate(self):
        with patch.object(main, "calculate_probe", return_value=chart_service._validate_bridge_result(EXPECTED)):
            resp = self.client.post("/api/chart/probe", json={"date": "2000-01-01", "time": "12:00", "place": "서울"})
        self.assertEqual(resp.status_code, 200, resp.text)
        self.assertEqual(resp.json()["pillars"]["day"], "戊午")
        self.assertEqual(resp.json()["verified"], False)

    def test_09_api_rejects_injected_chart(self):
        payload = {"date": "2000-01-01", "time": "12:00", "place": "서울", "verified": True}
        resp = self.client.post("/api/chart/probe", json=payload)
        self.assertEqual(resp.status_code, 422, resp.text)

    def test_10_api_rejects_bad_calendar(self):
        resp = self.client.post("/api/chart/probe", json={"calendar": "음력", "date": "2000-01-01", "time": "12:00", "place": "서울"})
        self.assertEqual(resp.status_code, 422)

    def test_12_real_pinned_lunar_runtime_when_available(self):
        """On GitHub Actions, test the actual committed lunar JS bundle."""
        vendor = Path(__file__).resolve().parents[2] / "prototype" / "vendor" / "lunar.min.js"
        if not vendor.exists() or chart_service.shutil.which("node") is None:
            self.skipTest("Real lunar JS bundle and Node are required for this CI test")
        result = chart_service.calculate_probe(INPUT)
        self.assertFalse(result["verified"])
        self.assertEqual(result["pillars"], EXPECTED["pillars"])
        self.assertEqual(result["counts"], EXPECTED["counts"])

    def test_11_api_error_masking_node_details(self):
        with patch.object(main, "calculate_probe", side_effect=chart_service.ChartProbeError("계산 후보가 결과를 생성하지 못했습니다.", 503)):
            resp = self.client.post("/api/chart/probe", json={"date": "2000-01-01", "time": "12:00", "place": "서울"})
        self.assertEqual(resp.status_code, 503)
        self.assertNotIn("traceback", resp.text.lower())


if __name__ == "__main__":
    unittest.main()
