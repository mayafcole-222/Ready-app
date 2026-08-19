import test from "node:test";
import assert from "node:assert/strict";
import { enrichCalendarEvent } from "../lib/calendar/enrich-events";
import { buildJourneyStops } from "../lib/journey/build-journey-stops";
import { buildJourneyTimeline } from "../lib/journey/build-journey-timeline";
import type { CalendarEvent, Errand, SuggestedErrandSlot } from "../lib/types";

const timezone="America/New_York";
const ready=(id:string,title:string,startAt:string)=>enrichCalendarEvent({id,title,startAt,endAt:new Date(new Date(startAt).getTime()+30*60_000).toISOString(),allDay:false,status:"confirmed"} satisfies CalendarEvent);
const errand=(id:string,title:string):Errand=>({id,title,estimatedMinutes:20,priority:"normal",status:"open"});
const slot=(errandId:string,startAt:string):SuggestedErrandSlot=>({errandId,startAt,endAt:new Date(new Date(startAt).getTime()+20*60_000).toISOString(),reason:"Ready found a window.",status:"scheduled"});

test("canonical epochs place a 4:40 errand before offset-bearing evening events",()=>{const events=[ready("walk","Walk the Dog","2026-08-18T19:30:00-04:00"),ready("wind","Wind Down","2026-08-18T21:30:00-04:00")],errands=[errand("mail","Mail package")],items=buildJourneyTimeline(events,buildJourneyStops(events,timezone),errands,[slot("mail","2026-08-18T20:40:00.000Z")]);assert.deepEqual(items.map(item=>item.id),["mail","walk","wind"]);assert.ok(items[0].startEpoch<items[1].startEpoch)});
test("multiple errands and fixed stops form one chronological timeline",()=>{const events=[ready("walk","Walk the Dog","2026-08-18T19:30:00-04:00"),ready("wind","Wind Down","2026-08-18T21:30:00-04:00")],errands=[errand("cake","Cake"),errand("mail","Mail")],items=buildJourneyTimeline(events,buildJourneyStops(events,timezone),errands,[slot("cake","2026-08-18T20:40:00.000Z"),slot("mail","2026-08-19T00:40:00.000Z")]);assert.deepEqual(items.map(item=>item.id),["cake","walk","mail","wind"])});
test("fixed commitments win exact timestamp ties deterministically",()=>{const events=[ready("fixed","Fixed","2026-08-18T16:00:00-04:00")],errands=[errand("flex","Flexible")],items=buildJourneyTimeline(events,buildJourneyStops(events,timezone),errands,[slot("flex","2026-08-18T20:00:00.000Z")]);assert.deepEqual(items.map(item=>item.kind),["event","errand"])});
test("no-fit errands never receive a fake timeline position",()=>{const events:ReturnType<typeof ready>[]=[],errands=[errand("cake","Cake")],items=buildJourneyTimeline(events,[],errands,[{errandId:"cake",status:"no-fit",reason:"No safe window."}]);assert.deepEqual(items,[])});
