'use strict';
/* Offline contracts only: no auth, database, or external requests. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'prototype/popo-profile-crud.js'),'utf8');
const css=fs.readFileSync(path.join(root,'prototype/popo-profile-crud.css'),'utf8');
let count=0;
function test(name,fn){fn();count++;console.log('PASS',name);}
test('redundant Done button is not created or referenced',()=>{assert.doesNotMatch(js,/popo-profile-done|\bdone\./);assert.doesNotMatch(css,/popo-profile-done/);});
test('X and Escape retain return-to-account handlers',()=>{assert.match(js,/close\.addEventListener\('click',backToAccount\)/);assert.match(js,/dialog\.addEventListener\('cancel',event=>\{event.preventDefault\(\);event.stopPropagation\(\);backToAccount\(\);\}\)/);});
test('save still returns to account after confirmed write',()=>{assert.match(js,/response\.data\.id!==expectedId/);assert.match(js,/dialog.close\('saved'\)/);assert.match(js,/openAccount\(\{message:notice,expectedUserId:owner\}\)/);});
test('card uses two columns with right-side actions',()=>assert.match(css,/\.popo-profile-manager \.popo-profile-item\{display:grid;grid-template-columns:minmax\(0,1fr\) 44px/));
test('right-side buttons remain at least 44px with no divider',()=>{assert.match(css,/\.popo-profile-manager \.popo-profile-item-actions\{display:flex;flex-direction:column/);assert.match(css,/gap:4px;border-top:0;padding:0/);assert.match(css,/width:44px;min-width:44px;min-height:44px/);});
test('small phones keep two-column card and 44px buttons',()=>assert.match(css,/@media\(max-width:360px\)\{[\s\S]*?\.popo-profile-manager \.popo-profile-item\{grid-template-columns:minmax\(0,1fr\) 44px/));
test('edit/delete labels and click behavior unchanged',()=>{assert.match(js,/사주 수정/);assert.match(js,/사주 삭제/);assert.match(js,/if\(!busy\)resetForm\(row\)/);assert.match(js,/if\(!busy\)void removeRow\(row\)/);});
test('time picker auto-close and unknown remain unchanged',()=>{assert.match(js,/picker.close\('applied'\)/);assert.match(js,/time.type='hidden'/);assert.match(js,/unknown.checked=false/);});
console.log(`STAGE 5C.3 TOTAL ${count} PASS 0 FAIL`);
