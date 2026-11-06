'use strict';
// Static UI contracts complement the offline browser interaction tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'prototype/popo-profile-crud.js'),'utf8');
const css=fs.readFileSync(path.join(root,'prototype/popo-profile-crud.css'),'utf8');
let count=0;
function test(name,fn){fn();count++;console.log('PASS',name);}
test('normal list refresh button and wording removed',()=>{assert.doesNotMatch(js,/popo-profile-refresh|목록 새로고침/);assert.doesNotMatch(css,/popo-profile-refresh/);});
test('recovery button starts hidden, visible only on failed list read',()=>{assert.match(js,/const retry=[^\n]+retry.hidden=true/);assert.match(js,/catch\(err\)\{[\s\S]*?retry.hidden=false/);assert.match(css,/\.popo-profile-retry\[hidden\]/);});
test('vault editor remembers its origin',()=>{assert.match(js,/const resetForm=\(row,origin='vault'\)=>/);assert.match(js,/formReturn=origin==='account'\?'account':'vault'/);assert.match(js,/mode==='new'[\s\S]*?resetForm\(null,'account'\)/);});
test('confirmed save branches to the correct originating screen',()=>{assert.match(js,/response\.data\.id!==expectedId/);assert.match(js,/if\(formReturn==='vault'\)\{[\s\S]*?await refreshAfterWrite\(ticket,notice,expectedId,vaultScrollTop\)/);assert.match(js,/dialog.close\('saved'\)/);});
test('confirmed delete reads the latest list in the same dialog',()=>{assert.match(js,/data\.id!==row.id/);assert.match(js,/await refreshAfterWrite\(ticket,'사주 정보를 삭제했어.'/);assert.match(js,/async function refreshAfterWrite[\s\S]*?await reload\(ticket\)/);});
test('X or cancel from vault editor returns one level to vault',()=>{assert.match(js,/if\(!form.hidden&&formReturn==='vault'\)\{void returnToVault\(\);return;\}/);assert.match(js,/cancel.addEventListener\('click',backToAccount\)/);});
test('vault X still returns to refreshed My Page',()=>{assert.match(js,/returnAccount=true;returnOwner=currentUserId;returnNotice='';dialog.close\('back'\)/);assert.match(js,/openAccount\(\{message:notice,expectedUserId:owner\}\)/);});
test('retry is read-only, never repeats a write',()=>{const block=js.split("retry.addEventListener('click',async()=>{")[1].split("more.addEventListener")[0];assert.match(block,/await reload\(ticket,retryAppend\)/);assert.doesNotMatch(block,/\.insert\(|\.update\(|\.delete\(|removeRow\(/);});
test('stale-account guards and owner filters remain',()=>{assert.match(js,/verifiedUser\(client\)/);assert.match(js,/if\(!current\(ticket\)\|\|serial!==readSerial\)return false/);assert.match(js,/\.eq\('user_id',user.id\)/);assert.match(js,/is_anonymous===true/);});
test('card focus and scroll restore without reopening My Page',()=>{assert.match(js,/const focusList=/);assert.match(js,/dialog.scrollTop=position/);assert.match(js,/focus\(\{preventScroll:true\}\)/);assert.match(js,/li.dataset.profileId=row.id/);});
console.log(`STAGE 5C.4 TOTAL ${count} PASS 0 FAIL`);
