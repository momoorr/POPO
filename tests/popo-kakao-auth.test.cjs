const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('../prototype/popo-kakao-auth.js');
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name)}
test('only public Supabase publishable keys accepted',()=>{
  assert(api.isPublishableKey('sb_publishable_abcdefghij123456'));
  assert(!api.isPublishableKey('sb_secret_abcdefghij123456'));
  assert(!api.isPublishableKey('service_role'));
  assert(!api.isPublishableKey('eyJabc.def.ghi'));
});
test('HTTPS POPO project URL and public key required',()=>{
  assert(api.isSafeConfig({url:'https://abc123.supabase.co',publishableKey:'sb_publishable_abcdefghij123456'}));
  assert(!api.isSafeConfig({url:'https://abc123.supabase.co/auth/v1/callback',publishableKey:'sb_publishable_abcdefghij123456'}));
  assert(!api.isSafeConfig({url:'http://abc123.supabase.co',publishableKey:'sb_publishable_abcdefghij123456'}));
});
test('OAuth redirect uses only same-origin path',()=>{
  assert.equal(api.redirectFor(new URL('http://127.0.0.1:5501/prototype/index.html#chart')),
    'http://127.0.0.1:5501/prototype/index.html');
  assert.equal(api.redirectFor(new URL('https://example.github.io/POPO/prototype/index.html?next=https://evil.example/#home')),
    'https://example.github.io/POPO/prototype/index.html');
});
test('user provided display name is bounded',()=>{
  assert.equal(api.safeName(''), '포포 회원');
  assert.equal(api.safeName('a'.repeat(60)).length,40);
});
test('no login mock or hardcoded personal data in script',()=>{
  const code=fs.readFileSync(path.join(__dirname,'..','prototype','popo-kakao-auth.js'),'utf8');
  assert(code.includes('auth.getUser()'));
  assert(code.includes("provider:'kakao'"));
  assert(code.includes(".from('popo_profiles')"));
  assert(!code.includes('service_role'));
});
console.log(`POPO STAGE 5B UNIT TOTAL ${passed} PASS`);
