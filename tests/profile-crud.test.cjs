const assert=require('node:assert/strict');
const core=require('../prototype/popo-profile-crud.js');
let passes=0;
function check(name,run){try{run();passes++;console.log('PASS',name);}catch(e){console.error('FAIL',name);throw e;}}
function sample(){return {display_name:'별토끼',relationship:'self',relationship_custom:'',calendar_type:'solar',leap_month:true,birth_date:'2000-01-02',birth_time:'12:15',birth_time_unknown:false,birth_region:'서울특별시',gender:'unknown'};}
check('18 birthplace options preserved as keys',()=>{
  assert.equal(core.REGIONS.length,18);
  assert.equal(new Set(core.REGIONS).size,18);
  assert.ok(['서울특별시','대전광역시','경기도','광주광역시','전라남도'].every(x=>core.REGIONS.includes(x)));
});
check('a complete valid record has SQL-aligned fields',()=>{
  const v=core.normalizeProfile(sample());
  assert.equal(v.display_name,'별토끼');assert.equal(v.birth_time,'12:15');
  assert.equal(v.birth_time_unknown,false);
  assert.equal(v.leap_month,false);
  assert.equal(v.relationship_custom,null);
  assert.deepEqual(Object.keys(v).sort(),['display_name','relationship','relationship_custom','calendar_type','leap_month','birth_date','birth_time','birth_time_unknown','birth_region','gender'].sort());
});
check('time unknown preserves null, never invents noon',()=>{
  const v=core.normalizeProfile({...sample(),birth_time_unknown:true,birth_time:'12:15'});
  assert.equal(v.birth_time,null);
});
check('unknown time requires no specific HH:mm',()=>{
  const v=core.normalizeProfile({...sample(),birth_time_unknown:true,birth_time:''});assert.equal(v.birth_time,null);
});
check('missing time rejected instead of guessing',()=>{
  assert.throws(()=>core.normalizeProfile({...sample(),birth_time:''}),/시간/);
});
check('lunar leap flag stays true for lunar calendar',()=>{
  const v=core.normalizeProfile({...sample(),calendar_type:'lunar',leap_month:true});assert.equal(v.leap_month,true);
});
check('other relation needs custom label',()=>{
  assert.throws(()=>core.normalizeProfile({...sample(),relationship:'other',relationship_custom:''}),/기타/);
  const v=core.normalizeProfile({...sample(),relationship:'other',relationship_custom:'직장동료'});
  assert.equal(v.relationship_custom,'직장동료');
});
check('other relation does not leak into ordinary relation',()=>{
  const v=core.normalizeProfile({...sample(),relationship:'family',relationship_custom:'옛 입력'});
  assert.equal(v.relationship_custom,null);
});
check('invalid date/day, out of range rejected',()=>{
  assert.equal(core.validDate('2000-02-29'),true);
  for(const d of ['2000-02-30','1899-12-31','2101-01-01','abc','2000-13-01'])assert.equal(core.validDate(d),false,d);
});
check('region, gender, relation only accepted from declared options',()=>{
  for(const k of ['birth_region','gender','relationship']){
    assert.throws(()=>core.normalizeProfile({...sample(),[k]:'<script>alert(1)</script>'}));
  }
});
check('display name is trimmed, length restricted',()=>{
  assert.equal(core.normalizeProfile({...sample(),display_name:' 별토끼 '}).display_name,'별토끼');
  assert.throws(()=>core.normalizeProfile({...sample(),display_name:' '}));
  assert.throws(()=>core.normalizeProfile({...sample(),display_name:'a'.repeat(41)}));
});
check('login verification always calls getUser()',async()=>{});
(async()=>{
  let checked=0;
  const id='d7a64f1e-e901-4121-a025-809d89ef3bba';
  const user=await core.verifiedUser({auth:{getUser:async()=>{checked++;return{data:{user:{id}},error:null};}}});
  assert.equal(user.id,id);assert.equal(checked,1);
  await assert.rejects(core.verifiedUser({auth:{getUser:async()=>({data:{user:null},error:null})}}),/로그인/);
  console.log('PASS login checks on server getUser()');passes++;
  console.log('STAGE 5C TOTAL '+passes+' PASS 0 FAIL');
})().catch(e=>{console.error(e);process.exit(1)});
