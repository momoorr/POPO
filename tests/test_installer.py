"""Byte-preserving, idempotency and prerequisite tests for additive HTML patch."""
from pathlib import Path
import importlib.util

root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('installer',root/'APPLY_LOCAL_ONLY.py')
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
base=(root/'tests/installer-fixture.html').read_bytes()
for raw in [base,base.replace(b'\n',b'\r\n')]:
    value=mod.patch_html(raw)
    text=value.decode('utf-8')
    assert text.count(mod.CSS)==1 and text.count(mod.JS)==1
    assert text.find('popo-kakao-auth.js')<text.find('popo-profile-crud.js')
    assert (b'\r\n' in value)==(b'\r\n' in raw)
    assert 'data-popo-region-list="2026-11"' in text
    try:mod.patch_html(value)
    except RuntimeError:pass
    else:raise AssertionError('Duplicate patch must fail')
print('PASS HTML patch UTF-8 CRLF/LF, order, idempotency guard')
try:mod.patch_html(base.replace(b'popo-kakao-auth.js',b'missing-auth.js'))
except RuntimeError:pass
else:raise AssertionError('Missing auth adapter not blocked')
print('PASS missing auth prerequisite blocked')
