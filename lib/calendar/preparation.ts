import type { PreparationTask, PreparationTaskState, ReadyEvent } from "../types";

const PRESENTATION=/\b(presentation|crit|critique|review|demo|showcase|pitch)\b/i;
const CLASS=/\b(class|lecture|seminar|studio)\b/i;

export function buildPreparationTasks(event:ReadyEvent):PreparationTask[]{
  const tasks:PreparationTask[]=[];const add=(id:string,title:string,reason:string)=>{if(!tasks.some(task=>task.id===id)&&tasks.length<5)tasks.push({id,title,reason})};const context=`${event.title} ${event.description??""}`;
  if(PRESENTATION.test(context)){add("review-materials","Review presentation materials","The event appears to involve presenting or reviewing work.");add("confirm-files","Confirm your files are accessible","Ready inferred that accessible materials may matter for this event.");add("prepare-talking-points","Prepare talking points","A short set of talking points can reduce last-minute decisions.")}
  if(CLASS.test(context)){add("review-class-materials","Review class materials","The event appears to be a class, lecture, seminar, or studio session.");add("bring-class-materials","Bring required materials","This event may depend on physical or digital class materials.")}
  if(event.meetingUrl){add("open-meeting-link","Open the meeting link","A virtual meeting link is available on the event.");add("join-early","Join 5 minutes early","A small connection buffer may help for a virtual event.")}
  if(event.location&&!event.meetingUrl){add("confirm-location","Confirm the location","The calendar event includes an in-person location.");add("plan-departure","Plan your departure around the event start","Ready knows the start time but does not yet calculate travel time.")}
  if(event.attendees?.length){add("review-attendees","Review who you’re meeting with","The event includes attendees.");add("prepare-questions","Prepare questions or talking points","Knowing who is attending may help you prepare the conversation.")}
  if(event.description)add("review-description","Review the event details","The calendar description may contain useful preparation context.");
  if(tasks.length<2){add("review-purpose","Review what you want from this event","The calendar has limited context, so Ready is keeping preparation general.");add("gather-materials","Gather anything you already know you’ll need","Ready cannot confidently infer specific materials from the available event data.")}
  return tasks.slice(0,5);
}

export function preparationStateKey(eventId:string,taskId:string){return `${eventId}::${taskId}`}
export function isPreparationTaskComplete(state:PreparationTaskState,eventId:string,taskId:string){return Boolean(state[preparationStateKey(eventId,taskId)])}

export function upcomingEvents(events:ReadyEvent[],now=new Date()):ReadyEvent[]{
  return events.filter(event=>event.status!=="cancelled"&&(event.allDay?new Date(`${event.endAt}T00:00:00`).getTime()>now.getTime():new Date(event.endAt).getTime()>now.getTime())).sort((a,b)=>a.startAt.localeCompare(b.startAt));
}
