import test from "node:test";
import assert from "node:assert/strict";
import { buildPreparationTasks, isPreparationTaskComplete, preparationStateKey, upcomingEvents } from "../lib/calendar/preparation";
import { enrichCalendarEvent } from "../lib/calendar/enrich-events";
import type { CalendarEvent } from "../lib/types";

const event=(overrides:Partial<CalendarEvent>={}):CalendarEvent=>({id:"event-1",title:"Event",startAt:"2026-08-18T15:00:00-04:00",endAt:"2026-08-18T16:00:00-04:00",allDay:false,status:"confirmed",...overrides});
const taskIds=(value:CalendarEvent)=>buildPreparationTasks(enrichCalendarEvent(value)).map(task=>task.id);

test("prepares a virtual meeting without inventing travel",()=>{const ids=taskIds(event({meetingUrl:"https://meet.google.com/abc-defg-hij",description:"Weekly notes"}));assert.ok(ids.includes("open-meeting-link"));assert.ok(ids.includes("join-early"));assert.ok(!ids.includes("plan-departure"))});
test("prepares an in-person event from its real location",()=>{const ids=taskIds(event({location:"Design Studio"}));assert.ok(ids.includes("confirm-location"));assert.ok(ids.includes("plan-departure"));assert.ok(!ids.includes("open-meeting-link"))});
test("prepares presentation materials from title context",()=>{const ids=taskIds(event({title:"Portfolio Review"}));assert.deepEqual(ids.slice(0,3),["review-materials","confirm-files","prepare-talking-points"])});
test("uses attendees only when they are available",()=>{assert.ok(taskIds(event({attendees:["Alex","Sam"]})).includes("review-attendees"));assert.ok(!taskIds(event()).includes("review-attendees"))});
test("limited metadata gets a short generic checklist",()=>{const tasks=buildPreparationTasks(enrichCalendarEvent(event()));assert.equal(tasks.length,2);assert.deepEqual(tasks.map(task=>task.id),["review-purpose","gather-materials"])});
test("completion state is isolated by calendar event and task IDs",()=>{const state={[preparationStateKey("one","review-purpose")]:true};assert.equal(isPreparationTaskComplete(state,"one","review-purpose"),true);assert.equal(isPreparationTaskComplete(state,"two","review-purpose"),false)});
test("upcoming events are chronological and ended events are omitted",()=>{const values=[event({id:"later",startAt:"2026-08-18T16:00:00Z",endAt:"2026-08-18T17:00:00Z"}),event({id:"past",startAt:"2026-08-18T10:00:00Z",endAt:"2026-08-18T11:00:00Z"}),event({id:"next",startAt:"2026-08-18T13:00:00Z",endAt:"2026-08-18T14:00:00Z"})].map(enrichCalendarEvent);assert.deepEqual(upcomingEvents(values,new Date("2026-08-18T12:00:00Z")).map(item=>item.id),["next","later"])});
