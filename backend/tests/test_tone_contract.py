"""Stage 4C offline tone and partial-response test. No OpenAI credit used."""
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from fastapi.testclient import TestClient

# Only an import stub when SDK is absent in the offline test container;
# all responses are mocked, never make a network call.
import sys
import types
try:
    from openai import AsyncOpenAI as _AsyncOpenAI
except ImportError:
    stub=types.ModuleType('openai')
    stub.AsyncOpenAI=lambda **kwargs: None
    sys.modules['openai']=stub

import main
from chart_service import get_saju_chart


class FriendlyToneTests(unittest.TestCase):
    def test_tone_policy_keeps_tool_and_safety(self):
        self.assertIn('반말(해체)', main.SYSTEM)
        self.assertIn('get_saju_chart', main.SYSTEM)
        self.assertIn('verified=false', main.SYSTEM)
        self.assertIn('단정하지 마', main.SYSTEM)
        self.assertFalse(get_saju_chart()['verified'])

    def test_truncated_response_is_not_displayed_as_full_answer(self):
        partial=SimpleNamespace(
            status='incomplete', output_text='신살·격국·대운/세운: 특정', output=[],
            usage=SimpleNamespace(input_tokens=40, output_tokens=50),
        )
        class FakeResponses:
            async def create(self, **kwargs):
                return partial
        with tempfile.TemporaryDirectory() as temp:
            with patch.dict(os.environ, {'OPENAI_API_KEY':'mock_local_only'}), \
                    patch.object(main, 'USAGE_DB', Path(temp)/'usage.sqlite3'), \
                    patch.object(main, 'AsyncOpenAI', return_value=SimpleNamespace(responses=FakeResponses())):
                res=TestClient(main.app).post('/api/chat',json={'question':'오행이 뭐야?'})
        self.assertEqual(res.status_code,200,res.text)
        j=res.json()
        self.assertEqual(j['chart_verified'],False)
        self.assertNotIn('신살·격국',j['answer'])
        self.assertIn('중간에 멈췄어',j['answer'])

if __name__=='__main__':unittest.main()
