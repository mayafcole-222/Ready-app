import { readyDateTime } from "../calendar/day-boundaries";
import { getActiveReadyDate } from "../active-date";
import type { Errand, ReadyEvent, RejectedErrandSlots, SuggestedErrandSlot } from "../types";

export const ERRAND_TRANSITION_BUFFER_MINUTES=10;
export const ERRAND_DAY_START="08:00";
export const ERRAND_DAY_END="22:00";

type Window={start:number;end:number;afterEventId?:string;beforeEventId?:string};
const minutes=(value:number)=>value*60_000;
export const errandSlotKey=(slot:{startAt?:string;endAt?:string})=>`${slot.startAt??""}|${slot.endAt??""}`;

function eventWindows(events:ReadyEvent[],activeDate:string,timezone:string,now:Date):Window[]{
 const configuredStart=new Date(readyDateTime(activeDate,ERRAND_DAY_START,timezone)).getTime(),roundedNow=Math.ceil(now.getTime()/minutes(5))*minutes(5),dayStart=getActiveReadyDate(timezone,now)===activeDate?Math.max(configuredStart,roundedNow):configuredStart,dayEnd=new Date(readyDateTime(activeDate,ERRAND_DAY_END,timezone)).getTime(),buffer=minutes(ERRAND_TRANSITION_BUFFER_MINUTES);
 const fixed=events.filter(event=>!event.allDay&&event.status!=="cancelled").map(event=>({id:event.id,start:new Date(event.startAt).getTime(),end:new Date(event.endAt).getTime()})).filter(event=>Number.isFinite(event.start)&&Number.isFinite(event.end)&&event.end>dayStart&&event.start<dayEnd).sort((a,b)=>a.start-b.start||a.end-b.end||a.id.localeCompare(b.id));
 const windows:Window[]=[];let cursor=dayStart,afterEventId:string|undefined;
 for(const event of fixed){const protectedStart=Math.max(dayStart,event.start-buffer);if(protectedStart>cursor)windows.push({start:cursor,end:protectedStart,afterEventId,beforeEventId:event.id});cursor=Math.max(cursor,Math.min(dayEnd,event.end+buffer));afterEventId=event.id}
 if(cursor<dayEnd)windows.push({start:cursor,end:dayEnd,afterEventId});
 return windows;
}

function orderErrands(errands:Errand[]):Errand[]{const priority={high:0,normal:1,low:2};return [...errands].filter(errand=>errand.status==="open").sort((a,b)=>Number(!a.completeBy)-Number(!b.completeBy)||(a.completeBy??"").localeCompare(b.completeBy??"")||priority[a.priority]-priority[b.priority]||b.estimatedMinutes-a.estimatedMinutes||a.id.localeCompare(b.id))}
function reasonFor(window:Window,errand:Errand):string{if(errand.completeBy)return `Gets this done before your ${formatConstraint(errand.completeBy)} deadline.`;if(window.afterEventId&&window.beforeEventId)return "Fits between two fixed commitments.";if(window.beforeEventId)return "You have room before your next commitment.";if(window.afterEventId)return "Your day opens up after your last commitment.";return "Ready found an open window in your day."}
function formatConstraint(value:string){const [hour,minute]=value.split(":").map(Number);return new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:"UTC"}).format(new Date(Date.UTC(2020,0,1,hour,minute)))}

export function scheduleErrands(errands:Errand[],events:ReadyEvent[],activeDate:string,timezone:string,rejected:RejectedErrandSlots={},now=new Date()):SuggestedErrandSlot[]{
 const windows=eventWindows(events,activeDate,timezone,now),results:SuggestedErrandSlot[]=[];
 for(const errand of orderErrands(errands)){
  const duration=minutes(Math.max(1,errand.estimatedMinutes));let placed:SuggestedErrandSlot|undefined;
  const earliest=errand.earliestStart?new Date(readyDateTime(activeDate,errand.earliestStart,timezone)).getTime():Number.NEGATIVE_INFINITY,deadline=errand.completeBy?new Date(readyDateTime(activeDate,errand.completeBy,timezone)).getTime():Number.POSITIVE_INFINITY;
  for(let index=0;index<windows.length&&!placed;index++){
   const window=windows[index];let start=Math.max(window.start,earliest),end=start+duration;
   while(end<=window.end&&end<=deadline){const candidate={startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString()};if(!(rejected[errand.id]??[]).includes(errandSlotKey(candidate))){placed={errandId:errand.id,...candidate,afterEventId:window.afterEventId,beforeEventId:window.beforeEventId,reason:reasonFor(window,errand),status:"scheduled"};windows.splice(index,1,...(window.start<start?[{...window,end:start}]:[]),...(end<window.end?[{...window,start:end}]:[]));break}start+=minutes(ERRAND_TRANSITION_BUFFER_MINUTES);end=start+duration}
  }
  results.push(placed??{errandId:errand.id,status:"no-fit",reason:errand.completeBy?`Ready couldn't find a safe window before ${formatConstraint(errand.completeBy)}.`:"Ready couldn't find a safe window in today's fixed schedule."});
 }
 return results;
}

// Future extension: adjust candidate windows with business hours and a vendor-neutral
// RoutingProvider before placement. Location remains display-only in V1.
