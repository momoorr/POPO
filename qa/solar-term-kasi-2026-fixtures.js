/* POPO Stage 2C independent 2026 term times (KASI public calendar data).
 * SOURCE: https://astro.kasi.re.kr/kor/life/post/calendarData?year=2026
 * Times: yyyy-mm-dd HH:mm in Korea Standard Time, as published to the minute.
 * This is not an official certification of saju-four-pillars calculations.
 * The KASI calendar-data page warns its downloadable data is not the official gazette.
 */
(function(root,make){
  'use strict';
  const result=make();
  if(typeof module==='object'&&module.exports)module.exports=result;
  if(root)root.PopoKasiTerms2026=result;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const values=[["소한","小寒","2026-01-05 17:23"],["대한","大寒","2026-01-20 10:45"],["입춘","立春","2026-02-04 05:02"],["우수","雨水","2026-02-19 00:52"],["경칩","惊蛰","2026-03-05 22:59"],["춘분","春分","2026-03-20 23:46"],["청명","清明","2026-04-05 03:40"],["곡우","谷雨","2026-04-20 10:39"],["입하","立夏","2026-05-05 20:49"],["소만","小满","2026-05-21 09:37"],["망종","芒种","2026-06-06 00:48"],["하지","夏至","2026-06-21 17:25"],["소서","小暑","2026-07-07 10:57"],["대서","大暑","2026-07-23 04:13"],["입추","立秋","2026-08-07 20:43"],["처서","处暑","2026-08-23 11:19"],["백로","白露","2026-09-07 23:41"],["추분","秋分","2026-09-23 09:05"],["한로","寒露","2026-10-08 15:29"],["상강","霜降","2026-10-23 18:38"],["입동","立冬","2026-11-07 18:52"],["소설","小雪","2026-11-22 16:23"],["대설","大雪","2026-12-07 11:53"],["동지","DONG_ZHI","2026-12-22 05:50"]];
  const terms=values.map(([label,key,kst])=>Object.freeze({label,key,kst}));
  return Object.freeze({year:2026,source:'https://astro.kasi.re.kr/kor/life/post/calendarData?year=2026',timezone:'Asia/Seoul',terms:Object.freeze(terms)});
});
