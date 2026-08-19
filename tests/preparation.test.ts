import test from "node:test";
import assert from "node:assert/strict";
import { buildPreparationTasks, isPreparationTaskComplete, preparationStateKey, upcomingEvents } from "../lib/calendar/preparation";
import { enrichCalendarEvent } from "../lib/calendar/enrich-events";
import { addCustomPreparationTask, hideGeneratedPreparationTask, removeCustomPreparationTask, visibleGeneratedTasks } from "../lib/preparation/custom-tasks";
import { prioritizePreparationTasks } from "../lib/preparation/prioritize-tasks";
import type { CalendarEvent, PreparationTask } from "../lib/types";

const event=(overrides:Partial<CalendarEvent>={}):CalendarEvent=>({id:"event-1",title:"Event",startAt:"2026-08-18T15:00:00-04:00",endAt:"2026-08-18T16:00:00-04:00",allDay:false,status:"confirmed",...overrides});
const ready=(overrides:Partial<CalendarEvent>={})=>enrichCalendarEvent(event(overrides));
const ids=(overrides:Partial<CalendarEvent>)=>buildPreparationTasks(ready(overrides)).map(task=>task.id);

test("MADE Design Crit produces focused critique preparation",()=>{const value=ready({title:"MADE Design Crit",location:"182 Hope St",description:"Review our latest project"});assert.equal(value.category,"critique");assert.deepEqual(buildPreparationTasks(value).map(task=>task.title),["Pack laptop","Bring sketchbook","Review previous feedback","Open latest design file","Prepare 3 feedback questions"])});
test("presentation, coffee chat, interview, class, meeting, workout, and study rules are deterministic",()=>{const scenarios:[string,Partial<CalendarEvent>,string[]][]=[
  ["presentation",{title:"Startup Pitch"},["review-slides","presentation-file","charge-laptop"]],
  ["coffee_chat",{title:"Coffee Chat with Justin",attendees:["Justin"]},["review-person","conversation-questions","review-context"]],
  ["interview",{title:"Product Design Interview"},["company-notes","work-examples","interview-questions"]],
  ["class",{title:"MADE Studio Class"},["class-notes","class-materials","laptop-notebook"]],
  ["meeting",{title:"Project Team Meeting",attendees:["Alex"]},["review-agenda","talking-points","relevant-documents","review-attendees"]],
  ["workout",{title:"Pilates Workout"},["water-bottle","workout-clothes","workout-shoes"]],
  ["study",{title:"Deep Work Block"},["top-priority","required-files","charger"]],
 ];for(const [category,metadata,expected] of scenarios){const value=ready(metadata);assert.equal(value.category,category);assert.deepEqual(buildPreparationTasks(value).map(task=>task.id).slice(0,expected.length),expected)}});
test("virtual meeting prioritizes link and device setup without generic carry or commute tasks",()=>{const value=ready({title:"Project Team Meeting",meetingUrl:"https://meet.google.com/abc",description:"Weekly agenda"});assert.equal(value.category,"virtual_meeting");const taskIds=buildPreparationTasks(value).map(task=>task.id);assert.deepEqual(taskIds,["meeting-link","av-check","review-agenda","join-early"]);assert.ok(!taskIds.includes("confirm-location"));assert.ok(!taskIds.includes("charge-laptop"))});
test("attendees enrich explicit and otherwise ambiguous meeting-sized events",()=>{assert.ok(ids({title:"Team Sync",attendees:["Alex","Sam"]}).includes("review-attendees"));const ambiguous=ready({attendees:["Alex"]});assert.equal(ambiguous.category,"meeting");assert.ok(buildPreparationTasks(ambiguous).some(task=>task.id==="review-attendees"))});
test("limited metadata does not invent materials, links, or locations",()=>{const tasks=buildPreparationTasks(ready());assert.deepEqual(tasks.map(task=>task.id),["review-details"])});
test("home and empty-day scenarios do not create preparation noise",()=>{assert.deepEqual(buildPreparationTasks(ready({title:"Home",location:"Home"})),[]);assert.deepEqual(upcomingEvents([],new Date("2026-08-18T12:00:00Z")),[])});
test("canonical IDs deduplicate and priority controls visible order",()=>{const task=(id:string,title:string,priority:number):PreparationTask=>({id,title,priority,reason:"",category:"bring",generated:true});assert.deepEqual(prioritizePreparationTasks([task("bring-laptop","Bring laptop",2),task("pack-laptop","Pack laptop",1),task("notes","Review notes",3)]).map(value=>value.id),["pack-laptop","notes"])});
test("custom tasks are event-scoped, removable, and generated tasks can be hidden",()=>{let custom={};custom=addCustomPreparationTask(custom,"one","Bring samples");assert.equal(custom.one.length,1);assert.equal(custom.two,undefined);custom=removeCustomPreparationTask(custom,"one",custom.one[0].id);assert.equal(custom.one.length,0);const hidden=hideGeneratedPreparationTask({},"one","laptop"),tasks=[{id:"laptop"},{id:"notes"}];assert.deepEqual(visibleGeneratedTasks(tasks,hidden,"one").map(task=>task.id),["notes"]);assert.deepEqual(visibleGeneratedTasks(tasks,hidden,"two").map(task=>task.id),["laptop","notes"])});
test("completion state persists independently by event and task IDs",()=>{const state={[preparationStateKey("one","laptop")]:true};assert.equal(isPreparationTaskComplete(state,"one","laptop"),true);assert.equal(isPreparationTaskComplete(state,"two","laptop"),false)});
test("upcoming events are chronological while past events are omitted",()=>{const values=[ready({id:"later",startAt:"2026-08-18T16:00:00Z",endAt:"2026-08-18T17:00:00Z"}),ready({id:"past",startAt:"2026-08-18T10:00:00Z",endAt:"2026-08-18T11:00:00Z"}),ready({id:"next",startAt:"2026-08-18T13:00:00Z",endAt:"2026-08-18T14:00:00Z"})];assert.deepEqual(upcomingEvents(values,new Date("2026-08-18T12:00:00Z")).map(item=>item.id),["next","later"])});
