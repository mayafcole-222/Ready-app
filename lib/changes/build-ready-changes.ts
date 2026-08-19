import type { PeoplePrepResult, ReadyEvent, Recommendation, SuggestedErrandSlot } from "../types";

export interface ReadyDaySnapshot {
 eventIds:string[];
 events:{id:string;title:string}[];
 recommendations:{id:string;title:string;priority:Recommendation["priority"]}[];
 errands:{id:string;title:string;status:"scheduled"|"no-fit";startAt?:string}[];
 outfitTransitions:string[];
 peoplePrepEvents:{eventId:string;eventTitle:string}[];
}

export type ReadyChangeTrigger={type:"calendar-event-cancelled"|"calendar-event-restored"|"errand-updated"|"weather-updated";id:string;title:string};
export type ReadyChange=
 |{type:"event-added"|"event-removed";id:string;title:string;priority:number}
 |{type:"recommendation-added"|"recommendation-removed";id:string;title:string;recommendationPriority:Recommendation["priority"];priority:number}
 |{type:"errand-moved";id:string;title:string;previousTime:string;nextTime:string;priority:number}
 |{type:"errand-now-fits";id:string;title:string;nextTime:string;priority:number}
 |{type:"errand-no-longer-fits";id:string;title:string;previousTime:string;priority:number}
 |{type:"transition-added"|"transition-removed";id:string;title:string;priority:number}
 |{type:"people-prep-added"|"people-prep-removed";id:string;title:string;priority:number};

export function buildReadyDaySnapshot(input:{events:ReadyEvent[];recommendations:Recommendation[];errands:{title:string;slot:SuggestedErrandSlot}[];outfitTransitions?:string[];peoplePrep:PeoplePrepResult[]}):ReadyDaySnapshot{
 return {
  eventIds:input.events.map(event=>event.id).sort(),
  events:input.events.map(event=>({id:event.id,title:event.title})).sort((a,b)=>a.id.localeCompare(b.id)),
  recommendations:input.recommendations.filter(item=>!item.dismissed).map(item=>({id:item.id,title:item.title,priority:item.priority})).sort((a,b)=>a.id.localeCompare(b.id)),
  errands:input.errands.map(({title,slot})=>({id:slot.errandId,title,status:slot.status,...(slot.startAt?{startAt:slot.startAt}:{})})).sort((a,b)=>a.id.localeCompare(b.id)),
  outfitTransitions:[...(input.outfitTransitions??[])].sort(),
  peoplePrepEvents:input.peoplePrep.map(result=>({eventId:result.event.id,eventTitle:result.event.title})).sort((a,b)=>a.eventId.localeCompare(b.eventId)),
 };
}

const mapBy=<T extends {id:string}>(items:T[])=>new Map(items.map(item=>[item.id,item]));
const recommendationRank=(priority:Recommendation["priority"])=>priority==="essential"?30:priority==="helpful"?50:70;

export function buildReadyChanges(previous:ReadyDaySnapshot,next:ReadyDaySnapshot,_trigger:ReadyChangeTrigger,maxChanges=4):ReadyChange[]{
 const changes:ReadyChange[]=[],previousEvents=mapBy(previous.events),nextEvents=mapBy(next.events),previousRecs=mapBy(previous.recommendations),nextRecs=mapBy(next.recommendations),nextErrands=mapBy(next.errands);
 for(const event of previous.events)if(!nextEvents.has(event.id))changes.push({type:"event-removed",...event,priority:5});
 for(const event of next.events)if(!previousEvents.has(event.id))changes.push({type:"event-added",...event,priority:5});
 for(const errand of previous.errands){const updated=nextErrands.get(errand.id);if(!updated)continue;if(errand.status==="scheduled"&&updated.status==="scheduled"&&errand.startAt&&updated.startAt&&errand.startAt!==updated.startAt)changes.push({type:"errand-moved",id:errand.id,title:errand.title,previousTime:errand.startAt,nextTime:updated.startAt,priority:20});else if(errand.status==="no-fit"&&updated.status==="scheduled"&&updated.startAt)changes.push({type:"errand-now-fits",id:errand.id,title:errand.title,nextTime:updated.startAt,priority:10});else if(errand.status==="scheduled"&&updated.status==="no-fit"&&errand.startAt)changes.push({type:"errand-no-longer-fits",id:errand.id,title:errand.title,previousTime:errand.startAt,priority:0})}
 for(const recommendation of previous.recommendations)if(!nextRecs.has(recommendation.id))changes.push({type:"recommendation-removed",...recommendation,recommendationPriority:recommendation.priority,priority:recommendationRank(recommendation.priority)});
 for(const recommendation of next.recommendations)if(!previousRecs.has(recommendation.id))changes.push({type:"recommendation-added",...recommendation,recommendationPriority:recommendation.priority,priority:recommendationRank(recommendation.priority)});
 const previousTransitions=new Set(previous.outfitTransitions),nextTransitions=new Set(next.outfitTransitions);for(const title of previousTransitions)if(!nextTransitions.has(title))changes.push({type:"transition-removed",id:title,title,priority:40});for(const title of nextTransitions)if(!previousTransitions.has(title))changes.push({type:"transition-added",id:title,title,priority:40});
 const previousPrep=new Map(previous.peoplePrepEvents.map(item=>[item.eventId,item])),nextPrep=new Map(next.peoplePrepEvents.map(item=>[item.eventId,item]));for(const item of previous.peoplePrepEvents)if(!nextPrep.has(item.eventId))changes.push({type:"people-prep-removed",id:item.eventId,title:item.eventTitle,priority:60});for(const item of next.peoplePrepEvents)if(!previousPrep.has(item.eventId))changes.push({type:"people-prep-added",id:item.eventId,title:item.eventTitle,priority:60});
 return changes.sort((a,b)=>a.priority-b.priority||a.type.localeCompare(b.type)||a.id.localeCompare(b.id)).slice(0,Math.max(0,maxChanges));
}
