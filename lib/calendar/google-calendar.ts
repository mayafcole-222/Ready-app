import { readyDayBoundaries } from "./day-boundaries";
import type { CalendarEvent, CalendarProvider } from "../types";

const GOOGLE_EVENTS_URL="https://www.googleapis.com/calendar/v3/calendars/primary/events";
type GoogleDate={dateTime?:unknown;date?:unknown};
type GoogleEvent={id?:unknown;summary?:unknown;start?:unknown;end?:unknown;location?:unknown;description?:unknown;status?:unknown;attendees?:unknown;hangoutLink?:unknown;conferenceData?:unknown};
type GoogleEventsPage={items?:unknown;nextPageToken?:unknown};

export class GoogleCalendarApiError extends Error{constructor(public readonly status:number,message=`Google Calendar request failed (${status})`,public readonly reason?:string){super(message);this.name="GoogleCalendarApiError"}}

function googleErrorReason(value:unknown):string|undefined{
  if(!value||typeof value!=="object")return undefined;
  const error=(value as {error?:unknown}).error;if(!error||typeof error!=="object")return undefined;
  const payload=error as {status?:unknown;errors?:Array<{reason?:unknown}>;details?:Array<{reason?:unknown;metadata?:{service?:unknown}}>};
  const legacy=payload.errors?.find(item=>typeof item.reason==="string")?.reason;if(typeof legacy==="string")return legacy;
  const detail=payload.details?.find(item=>typeof item.reason==="string")?.reason;if(typeof detail==="string")return detail;
  if(typeof payload.status==="string")return payload.status;
  const service=payload.details?.find(item=>typeof item.metadata?.service==="string")?.metadata?.service;
  return service==="calendar-json.googleapis.com"?"SERVICE_DISABLED":undefined;
}

function normalizedDate(value:unknown):{value:string;allDay:boolean}|null{if(!value||typeof value!=="object")return null;const date=value as GoogleDate;if(typeof date.dateTime==="string")return {value:date.dateTime,allDay:false};if(typeof date.date==="string")return {value:date.date,allDay:true};return null}

export function normalizeGoogleEvent(value:unknown):CalendarEvent|null{
  if(!value||typeof value!=="object")return null;const event=value as GoogleEvent;
  if(typeof event.id!=="string")return null;const start=normalizedDate(event.start),end=normalizedDate(event.end);if(!start||!end||start.allDay!==end.allDay)return null;
  const status=event.status==="cancelled"?"cancelled":event.status==="tentative"?"tentative":"confirmed";
  const attendees=Array.isArray(event.attendees)?event.attendees.flatMap(value=>{if(!value||typeof value!=="object")return [];const attendee=value as {displayName?:unknown;email?:unknown;self?:unknown;resource?:unknown};if(attendee.self===true||attendee.resource===true)return [];const label=typeof attendee.displayName==="string"&&attendee.displayName.trim()?attendee.displayName:typeof attendee.email==="string"&&attendee.email.trim()?attendee.email:undefined;return label?[label]:[]}):[];
  const conference=event.conferenceData&&typeof event.conferenceData==="object"?event.conferenceData as {entryPoints?:unknown}:undefined;
  const videoEntry=Array.isArray(conference?.entryPoints)?conference.entryPoints.find(value=>value&&typeof value==="object"&&(value as {entryPointType?:unknown}).entryPointType==="video") as {uri?:unknown}|undefined:undefined;
  const meetingUrl=typeof event.hangoutLink==="string"?event.hangoutLink:typeof videoEntry?.uri==="string"?videoEntry.uri:undefined;
  return {id:event.id,title:typeof event.summary==="string"&&event.summary.trim()?event.summary:"Untitled event",startAt:start.value,endAt:end.value,allDay:start.allDay,...(typeof event.location==="string"&&event.location.trim()?{location:event.location}:{}),...(typeof event.description==="string"&&event.description.trim()?{description:event.description}:{}),...(attendees.length?{attendees}:{}),...(meetingUrl?{meetingUrl}:{}),status};
}

export function createGoogleCalendarProvider(options:{getAccessToken:()=>Promise<string>;timezone:string;fetcher?:typeof fetch}):CalendarProvider{
  const fetcher=options.fetcher??globalThis.fetch;
  return {async getEvents(date){const {timeMin,timeMax}=readyDayBoundaries(date,options.timezone);const events:CalendarEvent[]=[];const seenTokens=new Set<string>();let pageToken:string|undefined;
    do{const url=new URL(GOOGLE_EVENTS_URL);url.searchParams.set("timeMin",timeMin);url.searchParams.set("timeMax",timeMax);url.searchParams.set("singleEvents","true");url.searchParams.set("orderBy","startTime");url.searchParams.set("showDeleted","false");url.searchParams.set("conferenceDataVersion","1");url.searchParams.set("maxResults","250");if(pageToken)url.searchParams.set("pageToken",pageToken);
      const response=await fetcher(url,{headers:{authorization:`Bearer ${await options.getAccessToken()}`}});if(!response.ok){let message=`Google Calendar request failed (${response.status})`,reason:string|undefined;try{const errorPayload=await response.json() as {error?:{message?:unknown}};if(typeof errorPayload.error?.message==="string")message=errorPayload.error.message;reason=googleErrorReason(errorPayload)}catch{/* preserve status-only error */}throw new GoogleCalendarApiError(response.status,message,reason)}
      let page:GoogleEventsPage;try{page=await response.json() as GoogleEventsPage}catch{throw new GoogleCalendarApiError(502,"Google Calendar returned invalid JSON")}
      if(page.items!==undefined&&!Array.isArray(page.items))throw new GoogleCalendarApiError(502,"Google Calendar returned malformed events");
      for(const item of page.items??[]){const normalized=normalizeGoogleEvent(item);if(normalized)events.push(normalized)}
      pageToken=typeof page.nextPageToken==="string"?page.nextPageToken:undefined;if(pageToken&&seenTokens.has(pageToken))throw new GoogleCalendarApiError(502,"Google Calendar returned a repeated page token");if(pageToken)seenTokens.add(pageToken);
    }while(pageToken);
    return events;
  }};
}
