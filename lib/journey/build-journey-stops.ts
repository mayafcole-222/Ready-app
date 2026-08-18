import type { JourneyStop, ReadyEvent } from "../types";

function formatEventTime(event:ReadyEvent,timezone:string):string{
  if(event.allDay)return "All day";
  return new Intl.DateTimeFormat("en-US",{timeZone:timezone,hour:"numeric",minute:"2-digit"}).format(new Date(event.startAt));
}

function preparationNote(event:ReadyEvent):string|undefined{
  if(event.type==="presentation"&&event.typeConfidence>=.9)return "Bring presentation materials";
  if(event.type==="exercise"&&event.typeConfidence>=.9)return "Change into workout clothes";
  return undefined;
}

export function buildJourneyStops(events:ReadyEvent[],timezone:string):JourneyStop[]{
  return events.filter(event=>event.status!=="cancelled").map(event=>({
    id:event.id,
    time:formatEventTime(event,timezone),
    title:event.title,
    location:event.location??"Location not provided",
    ...(preparationNote(event)?{note:preparationNote(event)}:{}),
  }));
}
