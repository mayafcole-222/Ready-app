import type { ReadyEvent, TravelContext, TravelMode, TravelProvider, TravelRequest } from "../types";

export const DEFAULT_TRAVEL_SETTINGS={homeLocation:"",mode:"walking" as TravelMode,arrivalBufferMinutes:10};
export interface TravelProviderErrorDetails { provider?:"google_routes"; upstreamStatus?:number; googleCode?:number; googleStatus?:string; reason?:string; providerMessage?:string }
export class TravelProviderError extends Error{constructor(message:string,public readonly status=502,public readonly details:TravelProviderErrorDetails={}){super(message);this.name="TravelProviderError"}}

export function canCalculateTravel(event:ReadyEvent|undefined,homeLocation:string){return Boolean(event&&!event.allDay&&event.attendanceMode!=="virtual"&&event.location?.trim()&&homeLocation.trim())}
export function calculateLeaveAt(eventStartAt:string,durationMinutes:number,arrivalBufferMinutes:number):string|null{const start=new Date(eventStartAt).getTime();if(!Number.isFinite(start)||!Number.isFinite(durationMinutes)||durationMinutes<0||!Number.isFinite(arrivalBufferMinutes)||arrivalBufferMinutes<0)return null;return new Date(start-(durationMinutes+arrivalBufferMinutes)*60_000).toISOString()}
export function formatTravelMode(mode:TravelMode){return mode==="transit"?"public transit":mode}
export function formatZonedTime(value:string,timezone:string){return new Intl.DateTimeFormat("en-US",{timeZone:timezone,hour:"numeric",minute:"2-digit"}).format(new Date(value))}

export function createApiTravelProvider(fetcher:typeof fetch=globalThis.fetch):TravelProvider{return {async getTravelTime(request:TravelRequest){const response=await fetcher("/api/travel",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request),cache:"no-store"});if(!response.ok){let message="Travel time unavailable";try{const payload=await response.json() as {error?:unknown};if(typeof payload.error==="string")message=payload.error}catch{/* retain the safe fallback */}throw new TravelProviderError(message,response.status)}return await response.json() as TravelContext}}}
export const apiTravelProvider=createApiTravelProvider();
