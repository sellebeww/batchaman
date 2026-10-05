import { defaultThresholds, signEvent, type Batch, type BatchEvent, type Drop, type Kitchen, type EventInput } from '@batchaman/core';
export const SCENARIOS=['normal','late-delivery','missing-temperature','late-entry','clock-shift','multi-drop'] as const;
export type Scenario=typeof SCENARIOS[number];
export function simulate({seed=1,days=1,batchesPerDay=6,start='2026-10-05',scenario}:{seed?:number;days?:number;batchesPerDay?:number;start?:string;scenario?:Scenario}={}){
 if(!Number.isInteger(days)||days<1||days>365||!Number.isInteger(batchesPerDay)||batchesPerDay<1||batchesPerDay>100)throw new Error('Invalid simulation size');
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const kitchen:Kitchen={id:'synthetic-kitchen',name:'Dapur Sintetis DEMO',code:'DEMO',timezone:'Asia/Jakarta',thresholdProfileId:'placeholder-v1'};
 const batches:Batch[]=[],drops:Drop[]=[],events:BatchEvent[]=[];
 for(let day=0;day<days;day++)for(let n=0;n<batchesPerDay;n++){
  const kind=scenario??SCENARIOS[n%SCENARIOS.length]!;
  const base=Date.parse(start+'T02:00:00+07:00')+day*86400000+n*60000;
  const at=(m:number)=>new Date(base+m*60000).toISOString();
  const id=`syn-${seed}-${day}-${n}`,total=kind==='multi-drop'?2:1;
  batches.push({id,kitchenId:kitchen.id,shortCode:`DEMO-${new Date(base+7*3600000).toISOString().slice(0,10).replaceAll('-','')}-${String(n+1).padStart(2,'0')}`,menuName:`Menu sintetis ${n+1} · ${kind}`,portions:100*total,foodProfile:'COOKED_HOT',createdAt:at(-10),threshold:structuredClone(defaultThresholds.COOKED_HOT)});
  const add=(type:EventInput['type'],m:number,dropId?:string)=>{const input:EventInput={id:`${id}-${type}-${dropId??'all'}`,batchId:id,...(dropId?{dropId}:{}),type,role:type==='COOK_DONE'?'COOK':type==='PACKED'?'PACKER':type==='LOADED'?'DRIVER':'RECEIVER',occurredAt:at(m),recordedAt:at(m+(kind==='late-entry'?30:kind==='clock-shift'&&type==='PACKED'?-30:0)),deviceId:'synthetic-device',...(kind==='missing-temperature'||kind==='late-delivery'?{}:{tempC:65+Math.floor(random()*5)})};events.push(signEvent(input,events.at(-1)?.hash??''))};
  add('COOK_DONE',0);add('PACKED',15);add('LOADED',25);
  for(let d=0;d<total;d++){const dropId=id+'-drop-'+d;drops.push({id:dropId,batchId:id,recipientLabel:`Tujuan sintetis ${d+1}`,portions:100,routeLabel:'Rute sintetis',vehicleLabel:'Kendaraan DEMO'});add('ARRIVED',kind==='late-delivery'?150:45+d*30,dropId);add('SERVE_START',kind==='late-delivery'?180:60+d*30,dropId)}
 }
 return {kitchen,batches,drops,events};
}
