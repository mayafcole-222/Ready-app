import type { Errand, JourneyStop, ReadyEvent, SuggestedErrandSlot } from "../types";

export type JourneyTimelineItem=
 | {kind:"event";id:string;startAt:string;startEpoch:number;stop:JourneyStop;event:ReadyEvent}
 | {kind:"errand";id:string;startAt:string;startEpoch:number;slot:SuggestedErrandSlot;errand:Errand};

export function buildJourneyTimeline(events:ReadyEvent[],stops:JourneyStop[],errands:Errand[],suggestions:SuggestedErrandSlot[]):JourneyTimelineItem[]{
 const eventsById=new Map(events.map(event=>[event.id,event])),errandsById=new Map(errands.map(errand=>[errand.id,errand]));
 const eventItems:JourneyTimelineItem[]=stops.flatMap(stop=>{const event=eventsById.get(stop.id),startEpoch=event?new Date(event.startAt).getTime():Number.NaN;return event&&Number.isFinite(startEpoch)?[{kind:"event",id:event.id,startAt:event.startAt,startEpoch,stop,event}]:[]});
 const errandItems:JourneyTimelineItem[]=suggestions.flatMap(slot=>{const errand=errandsById.get(slot.errandId),startEpoch=slot.status==="scheduled"&&slot.startAt?new Date(slot.startAt).getTime():Number.NaN;return errand&&slot.status==="scheduled"&&slot.startAt&&Number.isFinite(startEpoch)?[{kind:"errand",id:errand.id,startAt:slot.startAt,startEpoch,slot,errand}]:[]});
 return [...eventItems,...errandItems].sort((a,b)=>a.startEpoch-b.startEpoch||(a.kind===b.kind?0:a.kind==="event"?-1:1)||a.id.localeCompare(b.id));
}

// Exact timestamp ties intentionally show fixed commitments before flexible errands.
