import test from "node:test";
import assert from "node:assert/strict";
import { enrichCalendarEvent, enrichCalendarEvents } from "../lib/calendar/enrich-events";
import { buildJourneyStops } from "../lib/journey/build-journey-stops";
import type { CalendarEvent } from "../lib/types";

function event(overrides:Partial<CalendarEvent>={}):CalendarEvent{return {id:"opaque-google-style-id_abc123",title:"Focus block",startAt:"2026-08-17T09:00:00-04:00",endAt:"2026-08-17T10:00:00-04:00",allDay:false,status:"confirmed",...overrides}}

test("keeps normalized facts and adds deterministic Ready-owned semantics",()=>{
  const source=event({title:"Portfolio presentation",description:"Client pitch",location:"Design Center"});
  const enriched=enrichCalendarEvent(source);
  assert.equal(enriched.id,source.id);
  assert.equal(enriched.startAt,source.startAt);
  assert.equal(enriched.type,"presentation");
  assert.ok(enriched.typeConfidence>=.9);
  assert.match(enriched.typeReason,/presentation/i);
});

test("does not force a low-confidence event classification",()=>{
  const enriched=enrichCalendarEvent(event({title:"Reserved"}));
  assert.equal(enriched.type,"unknown");
  assert.equal(enriched.typeConfidence,0);
});

test("filters cancelled events and orders active events by normalized start time",()=>{
  const enriched=enrichCalendarEvents([
    event({id:"later",title:"Dinner",startAt:"2026-08-17T19:00:00-04:00",endAt:"2026-08-17T20:00:00-04:00"}),
    event({id:"cancelled",status:"cancelled"}),
    event({id:"earlier",title:"Pilates class"}),
  ]);
  assert.deepEqual(enriched.map(item=>item.id),["earlier","later"]);
});

test("projects arbitrary ReadyEvent IDs into presentation-only journey stops",()=>{
  const readyEvents=enrichCalendarEvents([event({title:"Pilates class",location:undefined})]);
  const stops=buildJourneyStops(readyEvents,"America/New_York");
  assert.deepEqual(stops,[{id:"opaque-google-style-id_abc123",time:"9:00 AM",title:"Pilates class",location:"Location not provided",note:"Change into workout clothes"}]);
});

test("represents all-day events without inventing a time",()=>{
  const readyEvents=enrichCalendarEvents([event({title:"Conference",allDay:true,startAt:"2026-08-17T00:00:00-04:00",endAt:"2026-08-18T00:00:00-04:00"})]);
  assert.equal(buildJourneyStops(readyEvents,"America/New_York")[0].time,"All day");
});
