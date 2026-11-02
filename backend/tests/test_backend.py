"""Offline contract tests. No real LLM network calls or Korean almanac validation."""
import os
import sys
import types
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient

# This test suite runs without network/API credits. If the OpenAI SDK has not
# been installed in the test runner, provide an import-only stub; every actual
# request is replaced by a deterministic fake Responses client below.
try:
    from openai import AsyncOpenAI as _SdkClass  # noqa: F401
except ImportError:
    fake_sdk = types.ModuleType("openai")
    fake_sdk.AsyncOpenAI = lambda **kwargs: None
    sys.modules["openai"] = fake_sdk

import main
from chart_service import get_saju_chart


class FakeOutput:
    def __init__(self, kind, name=None, call_id=None):
        self.type = kind
        self.name = name
        self.call_id = call_id

    def model_dump(self, exclude_none=True):
        if self.type == "function_call":
            return {"type": "function_call", "name": self.name, "call_id": self.call_id, "arguments": "{}"}
        return {"type": self.type}


class FakeResponses:
    def __init__(self, replies):
        self.replies = list(replies)
        self.seen = []

    async def create(self, **kwargs):
        self.seen.append(kwargs)
        return self.replies.pop(0)


class FakeOpenAI:
    def __init__(self, replies):
        self.responses = FakeResponses(replies)


def reply(answer="", calls=None, input_tokens=100, output_tokens=100):
    return SimpleNamespace(output_text=answer, output=calls or [], usage=SimpleNamespace(input_tokens=input_tokens, output_tokens=output_tokens))


class BackendContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.client = TestClient(main.app)
        self.db = patch.object(main, "USAGE_DB", Path(self.temp.name) / "usage.sqlite3")
        self.db.start()
        self.key = patch.dict(os.environ, {"OPENAI_API_KEY": "test_only_fake_key"})
        self.key.start()

    def tearDown(self):
        self.key.stop()
        self.db.stop()
        self.temp.cleanup()

    def test_01_health_unverified(self):
        j = self.client.get("/health").json()
        self.assertEqual(j["chart_engine"], "not_verified")
        self.assertEqual(j["stage"], "local_only")

    def test_02_no_key_blocks_network(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            self.assertEqual(self.client.post("/api/chat", json={"question": "안녕"}).status_code, 503)

    def test_03_blank_question_rejected(self):
        self.assertEqual(self.client.post("/api/chat", json={"question": "   "}).status_code, 422)

    def test_04_untrusted_chart_rejected(self):
        self.assertEqual(self.client.post("/api/chat", json={"question": "풀이", "chart": {"verified": True}}).status_code, 422)

    def test_05_general_reply(self):
        fake = FakeOpenAI([reply("오행은 전통적 분류예요")])
        with patch.object(main, "AsyncOpenAI", return_value=fake):
            r = self.client.post("/api/chat", json={"question": "오행이 뭐야?"})
        self.assertEqual(r.status_code, 200, r.text)
        j = r.json()
        self.assertEqual(j["answer"], "오행은 전통적 분류예요")
        self.assertFalse(j["chart_verified"])
        self.assertEqual(j["tools_used"], [])
        self.assertFalse(fake.responses.seen[0]["store"])
        self.assertFalse(fake.responses.seen[0]["parallel_tool_calls"])

    def test_06_function_call_and_second_round(self):
        fake = FakeOpenAI([
            reply(calls=[FakeOutput("function_call", "get_saju_chart", "call_1")]),
            reply("현재 검증된 개인 명식은 제공하지 않아요"),
        ])
        with patch.object(main, "AsyncOpenAI", return_value=fake):
            r = self.client.post("/api/chat", json={"question": "내 사주를 풀이해줘"})
        self.assertEqual(r.status_code, 200, r.text)
        j = r.json()
        self.assertEqual(j["tools_used"], ["get_saju_chart"])
        self.assertFalse(j["chart_verified"])
        second = fake.responses.seen[1]["input"]
        tool_messages = [m for m in second if isinstance(m, dict) and m.get("type") == "function_call_output"]
        self.assertEqual(len(tool_messages), 1)
        self.assertIn('"verified": false', tool_messages[0]["output"])

    def test_07_history_sent_to_model(self):
        fake = FakeOpenAI([reply("반가워요")])
        with patch.object(main, "AsyncOpenAI", return_value=fake):
            r = self.client.post("/api/chat", json={"question": "그럼?", "history": [{"role": "user", "content": "오행이란?"}, {"role": "assistant", "content": "다섯 개의 상징이에요"}]})
        self.assertEqual(r.status_code, 200)
        items = fake.responses.seen[0]["input"]
        self.assertEqual([item["role"] for item in items], ["user", "assistant", "user"])

    def test_08_usage_soft_limit(self):
        con = main.usage_connection()
        try:
            con.execute("INSERT INTO spend (month,usd) VALUES (?,?)", (main.datetime.now(main.timezone.utc).strftime("%Y-%m"), main.BUDGET_USD))
            con.commit()
        finally:
            con.close()
        self.assertEqual(self.client.post("/api/chat", json={"question": "안녕"}).status_code, 429)

    def test_09_error_does_not_expose_internals(self):
        class Broken:
            async def create(self, **kwargs):
                raise RuntimeError("secret internal error")
        with patch.object(main, "AsyncOpenAI", return_value=SimpleNamespace(responses=Broken())):
            r = self.client.post("/api/chat", json={"question": "안녕"})
        self.assertEqual(r.status_code, 502)
        self.assertNotIn("secret internal error", r.text)

    def test_10_chart_service_never_trusts_client(self):
        self.assertEqual(get_saju_chart()["status"], "unavailable")
        self.assertFalse(get_saju_chart()["verified"])


if __name__ == "__main__":
    unittest.main()
