import type { CalendarEvent, CalendarProvider } from "../types";

export type CalendarConnectionState="disconnected"|"needs_reconnect";
export class CalendarConnectionError extends Error{constructor(public readonly state:CalendarConnectionState){super(state==="needs_reconnect"?"Google Calendar needs to be reconnected":"Google Calendar is not connected");this.name="CalendarConnectionError"}}

export function createApiCalendarProvider(fetcher:typeof fetch=globalThis.fetch):CalendarProvider{return {async getEvents(date){const response=await fetcher(`/api/calendar/events?date=${encodeURIComponent(date)}`,{credentials:"same-origin",cache:"no-store"});if(response.status===401){let state:CalendarConnectionState="disconnected";try{const payload=await response.json() as {status?:unknown};if(payload.status==="needs_reconnect")state="needs_reconnect"}catch{/* use disconnected */}throw new CalendarConnectionError(state)}if(!response.ok)throw new Error(`Ready calendar request failed (${response.status})`);const payload=await response.json() as {events?:unknown};if(!Array.isArray(payload.events))throw new Error("Ready calendar response is malformed");return payload.events as CalendarEvent[]}}}
export const apiCalendarProvider=createApiCalendarProvider();
