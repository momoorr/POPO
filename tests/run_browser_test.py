"""Optional OFFLINE mock-Auth/browser smoke test; never talks to real Supabase.

Requires `pip install playwright` and Chromium installed. In this environment,
Chromium is available at /usr/bin/chromium. The fixture runs via set_content,
so it never navigates to real hosts or accesses user credentials.
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright, Error as PlaywrightError

root=Path(__file__).resolve().parents[1]
html=(root/'tests/browser-fixture.html').read_text(encoding='utf-8')
html=re.sub(r'<script src="[^"]+" defer></script>','',html)
with sync_playwright() as p:
    try:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    except PlaywrightError:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    for width in [360,390,440,1440]:
        page=browser.new_page(viewport={'width':width,'height':840})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='load')
        for file in ['popo-account-nav.css','popo-kakao-auth.css','popo-profile-crud.css']:
            page.add_style_tag(content=(root/'prototype'/file).read_text(encoding='utf-8'))
        for file in ['popo-account-nav.js','popo-kakao-auth.js','popo-profile-crud.js']:
            page.add_script_tag(content=(root/'prototype'/file).read_text(encoding='utf-8'))
        page.wait_for_selector('#popo-account-trigger')
        page.wait_for_selector('.popo-profile-manage-from-account',state='attached')
        page.locator('#popo-account-trigger').click()
        page.wait_for_selector('.popo-auth-profile-box:visible')
        page.locator('.popo-auth-add-profile').click()
        page.wait_for_selector('#popo-profile-form:visible')
        assert page.locator('#birth-dialog').evaluate('(e)=>e.open') is False
        page.locator('#popo-profile-name').fill('달토끼')
        page.locator('#popo-profile-date').fill('2000-01-02')
        page.locator('#popo-profile-time').fill('12:15')
        page.locator('#popo-profile-region').select_option('대전광역시')
        page.locator('.popo-profile-save').click()
        page.wait_for_selector('.popo-profile-item')
        assert page.locator('.popo-profile-info strong').inner_text()=='달토끼'
        assert page.evaluate('window._mockRows.length')==1
        assert page.evaluate('window._mockRows[0].user_id')=='d7a64f1e-e901-4121-a025-809d89ef3bba'
        page.locator('.popo-profile-item-actions button').first.click()
        page.wait_for_selector('#popo-profile-form:visible')
        page.locator('#popo-profile-name').fill('달토끼 수정')
        page.locator('.popo-profile-save').click()
        page.wait_for_selector('.popo-profile-item')
        assert page.locator('.popo-profile-info strong').inner_text()=='달토끼 수정'
        page.on('dialog',lambda dialog:dialog.accept())
        page.locator('.popo-profile-remove').click()
        page.wait_for_selector('.popo-profile-empty')
        assert page.evaluate('window._mockRows.length')==0
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        assert not errors,errors
        print('PASS mocked CRUD and layout at',width,'px')
        page.close()
    browser.close()
print('MOCK BROWSER TESTS: 4 PASS 0 FAIL')
