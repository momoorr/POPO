/* POPO Stage 2C — compare *unmodified* lunar-javascript solar terms
 * with KASI's KST minute timestamps. This is QA-only, NOT production time correction.
 * PASS means the +60 minute hypothesis matches published times; it does NOT
 * make the current birth-time / eight-pillar engine safe to release.
 */
(function(root,make){
  'use strict';
  const api=make();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.PopoKasiTermCheck=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const OFFSET_MINUTES=60;
  function asSeconds(s){
    const m=/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(s));
    if(!m)throw new Error('Unexpected date text: '+s);
    const values=m.slice(1).map(Number);
    const y=values[0],mo=values[1],d=values[2],h=values[3],min=values[4],sec=values[5]||0;
    if(mo<1||mo>12||d<1||d>31||h>23||min>59||sec>59)throw new Error('Invalid calendar date: '+s);
    const date=new Date(Date.UTC(y,mo-1,d,h,min,sec));
    if(date.getUTCFullYear()!==y||date.getUTCMonth()!==mo-1||date.getUTCDate()!==d)throw new Error('Out-of-range date: '+s);
    return date.getTime()/1000;
  }
  function toMinuteText(seconds){
    // KASI publishes minutes (nearest minute), not fractional seconds.
    const d=new Date(Math.round(seconds/60)*60000);
    return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')+' '+String(d.getUTCHours()).padStart(2,'0')+':'+String(d.getUTCMinutes()).padStart(2,'0');
  }
  function run(lunar,refs){
    if(!lunar||!lunar.Solar||typeof lunar.Solar.fromYmd!=='function')throw new Error('Missing unmodified lunar Solar engine');
    if(!refs||!Array.isArray(refs.terms)||refs.terms.length!==24||refs.year!==2026)throw new Error('Missing 2026 KASI 24-term fixture');
    const solar=lunar.Solar;
    const table=solar.fromYmd(2026,7,1).getLunar().getJieQiTable();
    const checks=[];
    for(const entry of refs.terms){
      try{
        if(!table[entry.key])throw new Error('Missing solar term key: '+entry.key);
        const raw=table[entry.key].toYmdHms();
        const rawSec=asSeconds(raw), referenceSec=asSeconds(entry.kst);
        const correctedSec=rawSec+OFFSET_MINUTES*60;
        const rounded=toMinuteText(correctedSec);
        const same=(rounded===entry.kst);
        const rawDifferenceMinutes=(rawSec-referenceSec)/60;
        if(Math.abs(rawDifferenceMinutes)>120)throw new Error('Unexpected deviation, cannot assume fixed offset');
        checks.push({name:entry.label,source:entry.kst,raw,corrected:rounded,
          deltaSeconds:correctedSec-referenceSec,rawDifferenceMinutes,
          pass:same,error:same?'':'Corrected time differs from KASI published minute'});
      }catch(e){checks.push({name:entry.label,source:entry.kst,pass:false,error:String(e&&e.message||e)});}
    }
    // Demonstrate that treating an unmodified library clock as KST moves
    // the year/month threshold prematurely around 2026 Ipchun.
    let boundary=null;
    try{
      const at=(hour,minute)=>{
        const e=solar.fromYmdHms(2026,2,4,hour,minute,0).getLunar().getEightChar();
        if(typeof e.setSect==='function')e.setSect(2);
        return {year:e.getYear(),month:e.getMonth()};
      };
      const before=at(4,1),inGap=at(4,30),after=at(5,3);
      boundary={officialKst:'2026-02-04 05:02',probeKst:'2026-02-04 04:30',before,inGap,after,
        earlySwitch:before.year!==inGap.year||before.month!==inGap.month};
    }catch(e){boundary={error:String(e&&e.message||e),earlySwitch:null};}
    return {source:refs.source,total:checks.length,passed:checks.filter(c=>c.pass).length,
      failed:checks.filter(c=>!c.pass).length,rawMismatchCount:checks.filter(c=>Math.abs(c.rawDifferenceMinutes)>5).length,
      offsetMinutes:OFFSET_MINUTES,checks,boundary,
      safeForProduction:false,
      scope:'2026년 절기 24개 공개 KST 시각을 원본 라이브러리와 비교. +60분 시각 비교는 검증용이며 출생 시각·연월일시주 보정이 아님.'};
  }
  return {OFFSET_MINUTES,run,asSeconds,toMinuteText};
});
