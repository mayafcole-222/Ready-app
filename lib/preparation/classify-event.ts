import type { CalendarEvent, ReadyEventCategory } from "../types";

export interface EventCategoryClassification { category:ReadyEventCategory; confidence:number; reason:string }
export function classifyReadyEvent(event:CalendarEvent):EventCategoryClassification{
  const text=`${event.title} ${event.description??""} ${event.location??""}`.toLowerCase(),has=(pattern:RegExp)=>pattern.test(text),duration=event.allDay?0:Math.max(0,(new Date(event.endAt).getTime()-new Date(event.startAt).getTime())/60_000);
  if(has(/\b(crit|critique|design review|portfolio review)\b/))return {category:"critique",confidence:.97,reason:"The event explicitly indicates a critique or design review."};
  if(has(/\b(interview|screening call|candidate interview)\b/))return {category:"interview",confidence:.97,reason:"The event explicitly indicates an interview."};
  if(has(/\b(coffee chat|networking|informational interview|meet and greet)\b/))return {category:"coffee_chat",confidence:.95,reason:"The event indicates a coffee chat or networking conversation."};
  if(has(/\b(presentation|pitch|demo|showcase|keynote)\b/))return {category:"presentation",confidence:.94,reason:"The event indicates a presentation, pitch, demo, or showcase."};
  if(has(/\b(class|lecture|seminar|studio|workshop|course)\b/))return {category:"class",confidence:.92,reason:"The event indicates a class, studio, seminar, or workshop."};
  if(has(/\b(workout|gym|pilates|yoga|fitness|run|training session)\b/))return {category:"workout",confidence:.96,reason:"The event indicates exercise or a workout."};
  if(has(/\b(study|focus block|deep work|work block|library)\b/))return {category:"study",confidence:.88,reason:"The event indicates a study or focused work block."};
  if(has(/\b(flight|train|bus|travel|airport|station)\b/))return {category:"travel",confidence:.91,reason:"The event indicates travel."};
  if(has(/\b(doctor|dentist|therapy|appointment|checkup|salon)\b/))return {category:"appointment",confidence:.91,reason:"The event indicates an appointment."};
  if(has(/\b(dinner|lunch|brunch|party|reception|drinks|birthday|social)\b/))return {category:"social",confidence:.88,reason:"The event indicates a social occasion."};
  if(event.meetingUrl&&has(/\b(meet|meeting|sync|call|standup|1:1|one on one|team)\b/))return {category:"virtual_meeting",confidence:.96,reason:"The event is meeting-like and includes a virtual meeting link."};
  if(has(/\b(meet|meeting|sync|call|standup|planning|agenda|team)\b/)||Boolean(event.attendees?.length&&duration>0&&duration<=180))return {category:"meeting",confidence:.81,reason:"The event wording, attendees, or duration indicates a meeting."};
  return {category:"unknown",confidence:0,reason:"There is not enough context to classify this event confidently."};
}
