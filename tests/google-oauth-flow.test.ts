import test from "node:test";
import assert from "node:assert/strict";
import { GET as callback } from "../app/api/auth/google/callback/route";
import { GET as calendarEvents } from "../app/api/calendar/events/route";
import { GET as calendarStatus } from "../app/api/auth/google/status/route";
import { GET as disconnect } from "../app/api/auth/google/disconnect/route";
import { GET as resetGoogleCalendar } from "../app/api/dev/reset-google-calendar/route";

test("successful callback persists one connected session and immediately loads calendar events",async()=>{
  const previous={id:process.env.GOOGLE_CLIENT_ID,secret:process.env.GOOGLE_CLIENT_SECRET,redirect:process.env.GOOGLE_REDIRECT_URI,mode:process.env.NEXT_PUBLIC_READY_CALENDAR_MODE};const originalFetch=globalThis.fetch;
  process.env.GOOGLE_CLIENT_ID="test-client.apps.googleusercontent.com";process.env.GOOGLE_CLIENT_SECRET="test-secret";process.env.GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback";process.env.NEXT_PUBLIC_READY_CALENDAR_MODE="live";
  globalThis.fetch=async input=>{const url=String(input);if(url.includes("oauth2.googleapis.com/token"))return Response.json({access_token:"access-token",refresh_token:"refresh-token",expires_in:3600});if(url.includes("googleapis.com/calendar/v3"))return Response.json({items:[{id:"opaque-event-id",summary:"Pilates",start:{dateTime:"2026-08-18T17:30:00-04:00"},end:{dateTime:"2026-08-18T18:30:00-04:00"}}]});throw new Error(`Unexpected request: ${url}`)};
  try{
    const callbackResponse=await callback(new Request("http://localhost:3000/api/auth/google/callback?code=authorization-code&state=oauth-state",{headers:{cookie:"ready_google_oauth_state=oauth-state"}}));
    assert.equal(callbackResponse.status,302);assert.equal(callbackResponse.headers.get("location"),"http://localhost:3000/?calendar=connected");
    const setCookies=callbackResponse.headers.getSetCookie();assert.equal(setCookies.length,1);assert.match(setCookies[0],/^ready_google_calendar=/);const sessionCookie=setCookies[0].split(";",1)[0];assert.doesNotMatch(sessionCookie,/access-token|refresh-token/);
    const statusResponse=await calendarStatus(new Request("http://localhost:3000/api/auth/google/status",{headers:{cookie:sessionCookie}}));assert.deepEqual(await statusResponse.json(),{status:"connected"});
    const eventsResponse=await calendarEvents(new Request("http://localhost:3000/api/calendar/events?date=2026-08-18",{headers:{cookie:sessionCookie}}));assert.equal(eventsResponse.status,200);const payload=await eventsResponse.json() as {events:Array<{id:string}>};assert.deepEqual(payload.events.map(event=>event.id),["opaque-event-id"]);
  }finally{globalThis.fetch=originalFetch;for(const [key,value] of Object.entries(previous)){const envKey=key==="id"?"GOOGLE_CLIENT_ID":key==="secret"?"GOOGLE_CLIENT_SECRET":key==="redirect"?"GOOGLE_REDIRECT_URI":"NEXT_PUBLIC_READY_CALENDAR_MODE";if(value===undefined)delete process.env[envKey];else process.env[envKey]=value}}
});

test("callback reports missing codes and validates OAuth state",async()=>{
  const invalidState=await callback(new Request("http://localhost:3000/api/auth/google/callback?code=code&state=wrong",{headers:{cookie:"ready_google_oauth_state=expected"}}));assert.equal(invalidState.status,400);assert.deepEqual(await invalidState.json(),{error:"Invalid Google OAuth state"});
  const missingCode=await callback(new Request("http://localhost:3000/api/auth/google/callback?state=expected",{headers:{cookie:"ready_google_oauth_state=expected"}}));assert.equal(missingCode.status,400);assert.deepEqual(await missingCode.json(),{error:"Google OAuth code is missing"});
});

test("disconnect clears current and legacy Google Calendar cookies",async()=>{
  const response=await disconnect(new Request("http://localhost:3000/api/auth/google/disconnect"));const cookies=response.headers.getSetCookie();assert.equal(cookies.length,4);
  assert.ok(cookies.some(cookie=>cookie.startsWith("ready_google_calendar=")));assert.ok(cookies.some(cookie=>cookie.startsWith("ready_google_oauth_state=")&&cookie.includes("Path=/api/auth/google")));assert.ok(cookies.some(cookie=>cookie.startsWith("ready_google_oauth_state=")&&cookie.includes("Path=/;")));assert.ok(cookies.some(cookie=>cookie.startsWith("ready_google_calendar_reconnect=")));assert.ok(cookies.every(cookie=>cookie.includes("Max-Age=0")));
});

test("development reset clears one cookie per redirect and returns to Ready",async()=>{
  const previous=process.env.NODE_ENV;process.env.NODE_ENV="development";
  try{const expected=["ready_google_calendar=","ready_google_oauth_state=","ready_google_oauth_state=","ready_google_calendar_reconnect="];for(let step=0;step<4;step++){const response=await resetGoogleCalendar(new Request(`http://localhost:3000/api/dev/reset-google-calendar?step=${step}`));assert.equal(response.status,303);assert.ok(response.headers.get("set-cookie")?.startsWith(expected[step]));assert.equal(response.headers.get("location"),step===3?"http://localhost:3000/?calendar=reset":`http://localhost:3000/api/dev/reset-google-calendar?step=${step+1}`)}}finally{if(previous===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=previous}
});
