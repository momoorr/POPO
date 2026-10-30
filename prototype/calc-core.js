/* POPO calculation engine candidate adapter v1.3
 * Development proof-of-concept only. No production/medical/financial claims.
 * Do not call the language model to calculate pillars.
 */
(function(root,make){
  'use strict';
  const api=make();
  if(typeof module==='object' && module.exports) module.exports=api;
  if(root) root.PopoCalcCore=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
  'use strict';
  const VERSION='POPO-CALC-CANDIDATE-2026-10-30';
  const ENGINE='lunar-javascript@1.7.7';
  const ORDER=['wood','fire','earth','metal','water'];
  const LABELS={wood:'목',fire:'화',earth:'토',metal:'금',water:'수'};
  const GAN={甲:'wood',乙:'wood',丙:'fire',丁:'fire',戊:'earth',己:'earth',庚:'metal',辛:'metal',壬:'water',癸:'water'};
  // 지지의 대표 오행만 선택. 지장간/월령의 세기/신강신약에 쓰지 않는다.
  const ZHI={寅:'wood',卯:'wood',巳:'fire',午:'fire',辰:'earth',戌:'earth',丑:'earth',未:'earth',申:'metal',酉:'metal',亥:'water',子:'water'};

  function reject(message){throw new Error(message);}
  function validate(input){
    if(input.calendar!=='양력') reject('이 계산 엔진 후보 시험은 양력만 지원합니다. 음력·윤달은 별도 검증 후 추가합니다.');
    if(input.unknownTime) reject('출생 시간 미상 처리 정책이 미확정이라 현재 시험에서는 시간을 입력해야 합니다.');
    if(!/^(서울|부산|대전)/.test(String(input.place||''))) reject('이번 시험은 서울·부산·대전(한국 표준시 가정) 입력만 지원합니다.');
    const date=String(input.date||'');
    const dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if(!dm) reject('올바른 양력 생년월일을 입력해 주세요.');
    const y=Number(dm[1]),m=Number(dm[2]),d=Number(dm[3]);
    if(y<1990||y>2040) reject('기술 시험 지원 연도는 1990~2040년입니다. 그 외 연도는 별도 검증이 필요합니다.');
    if(m<1||m>12||d<1||d>31) reject('유효하지 않은 날짜입니다.');
    const dt=new Date(Date.UTC(y,m-1,d));
    if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d) reject('존재하지 않는 날짜입니다.');
    // 엄밀한 절입 비교·한국/중국 절입 시각 검증 전 보수적 차단.
    if(d>=3 && d<=9) reject('매월 3~9일은 절기 경계 가능성이 있어 이번 시험에서 제외합니다.');
    const tm=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(input.time||''));
    if(!tm) reject('출생 시간을 시:분 형식으로 입력해 주세요.');
    const hour=Number(tm[1]),minute=Number(tm[2]);
    if(hour===23||hour===0) reject('23:00~00:59는 자시/날짜 경계 정책 검증 후 지원합니다.');
    return {year:y,month:m,day:d,hour,minute,calendar:'양력',timezoneAssumption:'Asia/Seoul (KST, 보정 미지원)'};
  }
  function countPillars(pillars){
    const counts={wood:0,fire:0,earth:0,metal:0,water:0};
    for(const name of ['year','month','day','hour']){
      const value=String(pillars[name]||'');
      const chars=Array.from(value);
      if(chars.length!==2 || !GAN[chars[0]] || !ZHI[chars[1]]) reject('엔진의 간지 결과를 해석할 수 없습니다: '+name);
      counts[GAN[chars[0]]]++;
      counts[ZHI[chars[1]]]++;
    }
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    if(total!==8)reject('오행 집계 결과가 올바르지 않습니다.');
    return counts;
  }
  function calculateCandidate(input,api){
    const valid=validate(input);
    const Solar=api && api.Solar;
    if(!Solar || typeof Solar.fromYmdHms!=='function') reject('명식 계산 라이브러리를 읽지 못했습니다. 새로고침 후 다시 시도해 주세요.');
    let eight;
    try{
      eight=Solar.fromYmdHms(valid.year,valid.month,valid.day,valid.hour,valid.minute,0).getLunar().getEightChar();
      if(typeof eight.setSect==='function')eight.setSect(2); // 선택 정책: 실험값; 확정 아님.
    }catch(err){reject('엔진 후보가 값을 계산하지 못했습니다. 다른 날짜로 시험해 주세요.');}
    const pillars={year:eight.getYear(),month:eight.getMonth(),day:eight.getDay(),hour:eight.getTime()};
    return {
      inputPolicy:valid, pillars, counts:countPillars(pillars),
      version:VERSION, engine:ENGINE,
      displayLabel:'라이브러리 산출 시험값 · 한국 역법 교차 검증 전',
      countingRule:'년·월·일·시주 각 천간 1글자와 지지 1글자에 대표 오행 1개씩 배정(총 8글자). 지장간·월령·강약 미반영.'
    };
  }
  return {VERSION,ENGINE,ORDER,LABELS,validate,countPillars,calculateCandidate};
});
