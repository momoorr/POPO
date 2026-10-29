#!/usr/bin/env python3
"""포포 공개 저장소 기본 정적 검증(실제 서비스 QA가 아님)."""
import csv
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
required = [
  'README.md', 'PROGRESS.md', 'index.html', 'prototype/index.html',
  'prototype/styles.css', 'prototype/app.js',
  'docs/11-requirement-test-evidence-matrix.csv',
  'qa/01-test-cases.csv', 'data/60-day-pillar-character-map.csv',
  'portfolio/포포_기업제출용_서비스기획_포트폴리오_v0.6.pptx',
]
fail=[]
for name in required:
    if not (ROOT/name).is_file():
        fail.append('파일 누락: '+name)

with (ROOT/'data/60-day-pillar-character-map.csv').open(encoding='utf-8-sig', newline='') as f:
    chars=list(csv.DictReader(f))
if len(chars)!=60:
    fail.append(f'캐릭터 ID 수: {len(chars)} (예상 60)')
headers=set(chars[0]) if chars else set()
print('캐릭터 CSV 컬럼:', ', '.join(sorted(headers)))
# 실제 CSV의 일주 순번, 한자 일주, 캐릭터 ID가 각 60개인지만 검사한다.
for c in ('day_pillar_index','day_pillar','character_id'):
    if c in headers:
        vals=[r[c].strip() for r in chars]
        if len(set(vals))!=60 or any(not x for x in vals):
            fail.append('캐릭터 ID 누락/중복: '+c)

with (ROOT/'qa/01-test-cases.csv').open(encoding='utf-8-sig', newline='') as f:
    tests=list(csv.DictReader(f))
testids=[r['TestID'] for r in tests]
if len(testids)!=len(set(testids)):
    fail.append('중복 테스트 ID')
with (ROOT/'docs/11-requirement-test-evidence-matrix.csv').open(encoding='utf-8-sig', newline='') as f:
    matrix=list(csv.DictReader(f))
for r in matrix:
    if r['TestID'] not in testids:
        fail.append('추적표에 존재하지 않는 시험: '+r['TestID'])
    for field in ('DesignPolicy','UIReference'):
        if not (ROOT/r[field]).is_file():
            fail.append('추적표 문서 경로 없음: '+r[field])

# 공개 폴더에 .env, 개인키가 들어가는 것을 최소한의 정적 검증으로 방지
for pat in ('**/.env','**/.env.*','**/*.pem','**/*.key','**/id_rsa','**/id_ed25519'):
    for p in ROOT.glob(pat):
        if '_site' not in p.parts:
            fail.append('민감 파일 가능성: '+str(p.relative_to(ROOT)))

# 내부 상대 경로를 사용하는 기본 엔트리 확인
html=(ROOT/'index.html').read_text(encoding='utf-8')
if 'prototype/index.html' not in html:
    fail.append('루트 데모 엔트리 연결 누락')
print(f'검사: 필수 파일 {len(required)}개, 캐릭터 {len(chars)}개, 테스트 {len(tests)}개, 추적표 {len(matrix)}개')
if fail:
    for err in fail: print('FAIL:',err,file=sys.stderr)
    raise SystemExit(1)
print('PASS: 정적 저장소 검증 완료(실제 역법·AI·UX 테스트 아님)')
