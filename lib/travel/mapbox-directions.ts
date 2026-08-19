import type { TravelContext, TravelMode, TravelProvider } from "../types";
import { TravelProviderError } from "./travel";

const GEOCODING_URL="https://api.mapbox.com/search/geocode/v6/forward";
const DIRECTIONS_URL="https://api.mapbox.com/directions/v5";
export const MAPBOX_PROFILE:Partial<Record<TravelMode,string>>={walking:"mapbox/walking",driving:"mapbox/driving",cycling:"mapbox/cycling"};
type Coordinates=[number,number];

function addressKey(value:string){return value.trim().toLocaleLowerCase("en-US")}
function distanceLabel(value:unknown){if(typeof value!=="number"||value<0)return undefined;const miles=value/1609.344;return miles<.1?`${Math.round(value)} m`:`${miles.toFixed(miles<10?1:0)} mi`}
function safeMessage(value:unknown,token:string){if(typeof value!=="string")return undefined;return value.replaceAll(token,"[REDACTED]").replace(/pk\.[A-Za-z0-9._-]+/g,"[REDACTED]").slice(0,300)}
async function payload(response:Response){try{return await response.json() as Record<string,unknown>}catch{return {}}}
function mapboxError(status:number,body:Record<string,unknown>,token:string,reason="MAPBOX_ERROR"){const message=safeMessage(body.message,token);return new TravelProviderError(status>=500?"Mapbox is temporarily unavailable.":"Mapbox could not complete the travel request.",status,{provider:"mapbox",upstreamStatus:status,reason, ...(message?{providerMessage:message}:{})})}

export function createMapboxDirectionsProvider(options:{accessToken:string;fetcher?:typeof fetch}):TravelProvider{
  const fetcher=options.fetcher??globalThis.fetch;
  const send=async(url:URL)=>{try{return await fetcher(url)}catch{throw new TravelProviderError("Mapbox is temporarily unavailable.",502,{provider:"mapbox",reason:"MAPBOX_ERROR"})}};
  const geocode=async(address:string,reason:"ORIGIN_NOT_FOUND"|"DESTINATION_NOT_FOUND",cache:Map<string,Coordinates>):Promise<Coordinates>=>{
    const key=addressKey(address),cached=cache.get(key);if(cached)return cached;
    const url=new URL(GEOCODING_URL);url.searchParams.set("q",address);url.searchParams.set("limit","1");url.searchParams.set("access_token",options.accessToken);
    const response=await send(url);const body=await payload(response);if(!response.ok)throw mapboxError(response.status,body,options.accessToken);
    const feature=Array.isArray(body.features)?body.features[0] as {geometry?:{coordinates?:unknown}}|undefined:undefined,coordinates=feature?.geometry?.coordinates;
    if(!Array.isArray(coordinates)||coordinates.length<2||typeof coordinates[0]!=="number"||typeof coordinates[1]!=="number")throw new TravelProviderError(reason==="ORIGIN_NOT_FOUND"?"Origin could not be found.":"Destination could not be found.",422,{provider:"mapbox",upstreamStatus:response.status,reason});
    const result:Coordinates=[coordinates[0],coordinates[1]];cache.set(key,result);return result;
  };
  return {async getTravelTime(request){
    const profile=MAPBOX_PROFILE[request.mode];if(!profile)throw new TravelProviderError("Public transit routing is not supported yet.",422,{provider:"mapbox",reason:"TRANSIT_NOT_SUPPORTED"});
    const cache=new Map<string,Coordinates>(),origin=await geocode(request.origin,"ORIGIN_NOT_FOUND",cache),destination=await geocode(request.destination,"DESTINATION_NOT_FOUND",cache),coordinates=`${origin.join(",")};${destination.join(",")}`;
    const url=new URL(`${DIRECTIONS_URL}/${profile}/${coordinates}`);url.searchParams.set("access_token",options.accessToken);url.searchParams.set("overview","false");
    const response=await send(url);const body=await payload(response);if(!response.ok)throw mapboxError(response.status,body,options.accessToken);
    const route=Array.isArray(body.routes)?body.routes[0] as {duration?:unknown;distance?:unknown}|undefined:undefined;
    if(!route||typeof route.duration!=="number"||route.duration<0)throw new TravelProviderError("No route was found for these locations.",422,{provider:"mapbox",upstreamStatus:response.status,reason:"ROUTE_NOT_FOUND"});
    return {origin:request.origin,destination:request.destination,mode:request.mode,durationMinutes:Math.max(1,Math.ceil(route.duration/60)),...(distanceLabel(route.distance)?{distance:distanceLabel(route.distance)}:{})} as TravelContext;
  }};
}
