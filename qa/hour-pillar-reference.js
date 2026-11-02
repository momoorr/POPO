/* POPO Stage 2B: independent traditional sidubeop (hour-stem) rule.
 * NOT astronomical validation; interprets clock time directly in provisional KST.
 * Fixed day stems originate from external reference fixtures, not candidate output.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PopoHourReference=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const STEMS=Array.from('甲乙丙丁戊己庚辛壬癸');
  const BRANCHES=Array.from('子丑寅卯辰巳午未申酉戌亥');
  // 시두법: 甲己->甲子, 乙庚->丙子, 丙辛->戊子, 丁壬->庚子, 戊癸->壬子.
  const HOUR_START={甲:0,己:0,乙:2,庚:2,丙:4,辛:4,丁:6,壬:6,戊:8,癸:8};
  const HOURS=Object.freeze(Array.from({length:11},(_,i)=>String(i*2+1).padStart(2,'0')+':30'));
  const BOUNDARY=Object.freeze(['01:00','02:59','03:00','04:59','05:00','10:59','11:00','12:59','13:00','20:59','21:00','22:59']);
  function hourPillar(dayPillar,time){
    if(!/^([甲乙丙丁戊己庚辛壬癸])[子丑寅卯辰巳午未申酉戌亥]$/.test(String(dayPillar)))throw Error('Invalid external-reference day pillar');
    const match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(time));
    if(!match)throw Error('Invalid clock time');
    const hh=Number(match[1]);
    if(hh===0||hh===23)throw Error('Zi-hour boundary deliberately excluded');
    const index=Math.floor((hh+1)/2);
    const start=HOUR_START[dayPillar[0]];
    return STEMS[(start+index)%10]+BRANCHES[index];
  }
  function run(core,lunarApi,reference){
    if(!core||typeof core.calculateCandidate!=='function')throw Error('Missing POPO calculation core');
    if(!lunarApi||!lunarApi.Solar||typeof lunarApi.Solar.fromYmdHms!=='function')throw Error('Missing lunar-javascript candidate engine');
    if(!reference||!Array.isArray(reference.fixtures)||reference.fixtures.length<12)throw Error('Missing public date fixtures');
    const results=[];
    const base={calendar:'양력',date:'2000-01-01',time:'12:00',unknownTime:false,place:'서울'};
    function one(fixture,time,group){
      const name=fixture.date+' '+time;
      try{
        const expected=hourPillar(fixture.day,time);
        const found=core.calculateCandidate({...base,date:fixture.date,time},lunarApi);
        for(const k of ['year','month','day'])if(found.pillars[k]!==fixture[k])throw Error(`${k}: 외부기준 ${fixture[k]}, 후보 ${found.pillars[k]}`);
        if(found.pillars.hour!==expected)throw Error(`시두법 기준 ${expected}, 후보 ${found.pillars.hour}`);
        results.push({name,group,pass:true,message:`시주 ${expected} 일치`});
      }catch(err){results.push({name,group,pass:false,message:String(err&&err.message||err)});}
    }
    reference.fixtures.forEach(f=>HOURS.forEach(t=>one(f,t,f.date)));
    for(const f of [reference.fixtures[0],reference.fixtures[6]]){
      if(!f)throw Error('Missing boundary reference');
      BOUNDARY.forEach(t=>one(f,t,f.date+' · 시각 경계'));
    }
    return {
      total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,results,
      scope:'2000년 공개 날짜 자료의 일간 + 전통 시두법, KST 무보정(가정). 23~00시·지역 보정·절입 시각·한국 공식 만세력 미검증.'
    };
  }
  return {hourPillar,run,HOURS,BOUNDARY};
});
