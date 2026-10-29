#!/usr/bin/env python3
"""GitHub Pages에 목업 HTML/CSS/JS와 자산만 공개하도록 정적 사이트를 구성한다."""
from pathlib import Path
import shutil
R=Path(__file__).resolve().parents[1]
O=R/'_site'
if O.exists(): shutil.rmtree(O)
O.mkdir()
shutil.copy2(R/'index.html', O/'index.html')
shutil.copytree(R/'prototype', O/'prototype')
shutil.copytree(R/'assets', O/'assets')
(O/'.nojekyll').write_text('',encoding='utf-8')
print('Built Pages site:',O)
print('Published: index.html, prototype/, assets/ only')
