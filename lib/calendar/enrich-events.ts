import type { CalendarEvent, ReadyEvent, ReadyEventType } from "../types";

const MIN_CLASSIFICATION_CONFIDENCE=.75;

type Classification={type:ReadyEventType;confidence:number;reason:string;formality?:number};

function classifyEvent(event:CalendarEvent):Classification{
  const text=`${event.title} ${event.description??""}`.toLowerCase();
  const match=(pattern:RegExp)=>pattern.test(text);

  if(match(/\b(home|at home)\b/))return {type:"home",confidence:.98,reason:"The event explicitly indicates home."};
  if(match(/\b(pilates|yoga|workout|gym|fitness|run|running|exercise|training session)\b/))return {type:"exercise",confidence:.96,reason:"The title or description indicates exercise."};
  if(match(/\b(presentation|portfolio review|client review|demo day|pitch)\b/))return {type:"presentation",confidence:.92,reason:"The title or description indicates a presentation or formal review.",formality:4};
  if(match(/\b(dinner|lunch|brunch|party|reception|drinks|social)\b/))return {type:"social",confidence:.88,reason:"The title or description indicates a social event.",formality:3};
  if(match(/\b(work|studio|office|standup|planning|project|team|client|meeting)\b/))return {type:"work",confidence:.82,reason:"The title or description indicates a work event.",formality:2};
  return {type:"unknown",confidence:0,reason:"There is not enough information to classify this event."};
}

export function enrichCalendarEvent(event:CalendarEvent):ReadyEvent{
  const classification=classifyEvent(event);
  const attendanceMode=event.meetingUrl?"virtual":event.location?"in_person":"unknown";
  if(classification.confidence<MIN_CLASSIFICATION_CONFIDENCE)return {...event,type:"unknown",typeConfidence:classification.confidence,typeReason:classification.reason,attendanceMode};
  return {...event,type:classification.type,typeConfidence:classification.confidence,typeReason:classification.reason,attendanceMode,...(classification.formality?{formality:classification.formality}:{})};
}

export function enrichCalendarEvents(events:CalendarEvent[]):ReadyEvent[]{
  return events.filter(event=>event.status!=="cancelled").map(enrichCalendarEvent).sort((a,b)=>a.startAt.localeCompare(b.startAt));
}
