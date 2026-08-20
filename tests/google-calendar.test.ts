import test from "node:test";
import assert from "node:assert/strict";
import { createApiCalendarProvider, CalendarConnectionError } from "../lib/calendar/api-calendar";
import { enrichCalendarEvents } from "../lib/calendar/enrich-events";
import { readyDayBoundaries } from "../lib/calendar/day-boundaries";
import { createGoogleCalendarProvider, GoogleCalendarApiError, normalizeGoogleEvent } from "../lib/calendar/google-calendar";
import { GoogleAuthorizationError, validGoogleAccessToken } from "../lib/calendar/google-oauth";
import { sealGoogleSession, unsealGoogleSession } from "../lib/calendar/google-session";

test("normalizes timed, all-day, missing-location, untitled, cancelled, and recurring-instance events",()=>{
  assert.deepEqual(normalizeGoogleEvent({id:"timed",summary:"Pilates",start:{dateTime:"2026-08-17T17:30:00-04:00"},end:{dateTime:"2026-08-17T18:30:00-04:00"},location:"Form Studio",description:"Workout",status:"confirmed"}),{id:"timed",title:"Pilates",startAt:"2026-08-17T17:30:00-04:00",endAt:"2026-08-17T18:30:00-04:00",allDay:false,location:"Form Studio",description:"Workout",status:"confirmed"});
  assert.deepEqual(normalizeGoogleEvent({id:"all-day",start:{date:"2026-08-17"},end:{date:"2026-08-18"},status:"tentative"}),{id:"all-day",title:"Untitled event",startAt:"2026-08-17",endAt:"2026-08-18",allDay:true,status:"tentative"});
  assert.deepEqual(normalizeGoogleEvent({id:"recurring-instance",summary:"Dinner",recurringEventId:"series",start:{dateTime:"2026-08-17T19:30:00-04:00"},end:{dateTime:"2026-08-17T20:30:00-04:00"},status:"confirmed"}),{id:"recurring-instance",title:"Dinner",startAt:"2026-08-17T19:30:00-04:00",endAt:"2026-08-17T20:30:00-04:00",allDay:false,status:"confirmed"});
  const cancelled=normalizeGoogleEvent({id:"cancelled",summary:"Portfolio Review",start:{dateTime:"2026-08-17T13:00:00-04:00"},end:{dateTime:"2026-08-17T14:00:00-04:00"},status:"cancelled"});
  assert.equal(cancelled?.status,"cancelled");assert.deepEqual(enrichCalendarEvents(cancelled?[cancelled]:[]),[]);
  assert.equal(normalizeGoogleEvent({id:"malformed",start:{},end:{}}),null);
});

test("queries only the Ready local day and paginates primary expanded events",async()=>{
  const urls:URL[]=[];let calls=0;
  const provider=createGoogleCalendarProvider({timezone:"America/New_York",getAccessToken:async()=>"access-token",fetcher:async(input,init)=>{const url=new URL(String(input));urls.push(url);assert.equal(new Headers(init?.headers).get("authorization"),"Bearer access-token");calls++;return new Response(JSON.stringify(calls===1?{items:[{id:"first",summary:"Portfolio Review",start:{dateTime:"2026-08-17T13:00:00-04:00"},end:{dateTime:"2026-08-17T14:00:00-04:00"}}],nextPageToken:"next"}:{items:[{id:"second",summary:"Dinner",start:{dateTime:"2026-08-17T19:00:00-04:00"},end:{dateTime:"2026-08-17T20:00:00-04:00"}}]}))}});
  const events=await provider.getEvents("2026-08-17");
  assert.deepEqual(events.map(event=>event.id),["first","second"]);assert.equal(calls,2);
  assert.equal(urls[0].pathname,"/calendar/v3/calendars/primary/events");assert.equal(urls[0].searchParams.get("timeMin"),"2026-08-17T04:00:00.000Z");assert.equal(urls[0].searchParams.get("timeMax"),"2026-08-18T04:00:00.000Z");assert.equal(urls[0].searchParams.get("singleEvents"),"true");assert.equal(urls[0].searchParams.get("orderBy"),"startTime");assert.equal(urls[0].searchParams.get("showDeleted"),"false");assert.equal(urls[1].searchParams.get("pageToken"),"next");
});

test("uses timezone-aware local-day boundaries across daylight-saving changes",()=>{
  assert.deepEqual(readyDayBoundaries("2026-11-01","America/New_York"),{timeMin:"2026-11-01T04:00:00.000Z",timeMax:"2026-11-02T05:00:00.000Z"});
});

test("Google API failures throw and never substitute demo events",async()=>{
  const provider=createGoogleCalendarProvider({timezone:"America/New_York",getAccessToken:async()=>"token",fetcher:async()=>new Response("denied",{status:403})});
  await assert.rejects(provider.getEvents("2026-08-17"),error=>error instanceof GoogleCalendarApiError&&error.status===403);
});

test("extracts safe reasons from legacy and structured Google API errors",async()=>{
  for(const payload of [
    {error:{message:"Calendar API disabled",errors:[{reason:"accessNotConfigured"}]}},
    {error:{message:"Calendar API disabled",status:"PERMISSION_DENIED",details:[{"@type":"type.googleapis.com/google.rpc.ErrorInfo",reason:"SERVICE_DISABLED",metadata:{service:"calendar-json.googleapis.com"}}]}},
  ]){const provider=createGoogleCalendarProvider({timezone:"America/New_York",getAccessToken:async()=>"token",fetcher:async()=>Response.json(payload,{status:403})});await assert.rejects(provider.getEvents("2026-08-17"),error=>error instanceof GoogleCalendarApiError&&Boolean(error.reason)&&!error.message.includes("token"))}
});

test("client provider represents disconnected and reconnect states",async()=>{
  let requestOptions:RequestInit|undefined;const disconnected=createApiCalendarProvider(async(_input,init)=>{requestOptions=init;return Response.json({status:"disconnected"},{status:401})});
  await assert.rejects(disconnected.getEvents("2026-08-17"),error=>error instanceof CalendarConnectionError&&error.state==="disconnected");
  assert.equal(requestOptions?.credentials,"same-origin");assert.equal(requestOptions?.cache,"no-store");
  const reconnect=createApiCalendarProvider(async()=>Response.json({status:"needs_reconnect"},{status:401}));
  await assert.rejects(reconnect.getEvents("2026-08-17"),error=>error instanceof CalendarConnectionError&&error.state==="needs_reconnect");
  const failed=createApiCalendarProvider(async()=>Response.json({error:"failed"},{status:502}));
  await assert.rejects(failed.getEvents("2026-08-17"),/502/);
});

test("token session is encrypted and rejects tampering",async()=>{
  const session={status:"connected" as const,sessionId:"ready-session",accessToken:"access",refreshToken:"refresh",expiresAt:Date.now()+60_000},secret="test-only-secret";const sealed=await sealGoogleSession(session,secret);
  const tampered=`${sealed.startsWith("x")?"y":"x"}${sealed.slice(1)}`;
  assert.doesNotMatch(sealed,/access|refresh/);assert.deepEqual(await unsealGoogleSession(sealed,secret),session);assert.equal(await unsealGoogleSession(tampered,secret),null);
});

test("expired sessions refresh server-side and refresh failures require reconnect",async()=>{
  const previousId=process.env.GOOGLE_CLIENT_ID,previousSecret=process.env.GOOGLE_CLIENT_SECRET;process.env.GOOGLE_CLIENT_ID="test-client";process.env.GOOGLE_CLIENT_SECRET="test-secret";
  try{const session={status:"connected" as const,sessionId:"ready-session",accessToken:"expired",refreshToken:"refresh",expiresAt:0};const refreshed=await validGoogleAccessToken(session,async(_input,init)=>{const body=new URLSearchParams(String(init?.body));assert.equal(body.get("refresh_token"),"refresh");return Response.json({access_token:"new-access",expires_in:3600})});assert.deepEqual(refreshed,{accessToken:"new-access",refreshed:true});assert.equal(session.accessToken,"new-access");
    const revoked={status:"connected" as const,sessionId:"ready-session",accessToken:"expired",refreshToken:"revoked",expiresAt:0};await assert.rejects(validGoogleAccessToken(revoked,async()=>new Response("revoked",{status:400})),error=>error instanceof GoogleAuthorizationError);
  }finally{if(previousId===undefined)delete process.env.GOOGLE_CLIENT_ID;else process.env.GOOGLE_CLIENT_ID=previousId;if(previousSecret===undefined)delete process.env.GOOGLE_CLIENT_SECRET;else process.env.GOOGLE_CLIENT_SECRET=previousSecret}
});
