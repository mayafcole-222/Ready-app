import { createGoogleRoutesProvider } from "@/lib/travel/google-routes";
import { inspectGoogleMapsApiKey } from "@/lib/travel/google-api-key";
import { createMapboxDirectionsProvider } from "@/lib/travel/mapbox-directions";
import { TravelProviderError } from "@/lib/travel/travel";
import type { TravelMode, TravelProvider, TravelRequest } from "@/lib/types";

const MODES=new Set<TravelMode>(["walking","driving","transit","cycling"]);
type ProviderName="mapbox"|"google";
function providerName():ProviderName{return process.env.TRAVEL_PROVIDER==="google"?"google":"mapbox"}
function developmentDetails(error:TravelProviderError){return process.env.NODE_ENV==="production"?{}:{status:"travel_unavailable",provider:error.details.provider??providerName(),upstreamStatus:error.details.upstreamStatus,reason:error.details.reason??error.details.googleStatus??"UNKNOWN",message:error.details.providerMessage??error.message}}
function logContext(mode:TravelMode){return {mode,originSupplied:true,destinationSupplied:true}}
function selectedProvider(name:ProviderName):TravelProvider|Response{
  if(name==="google"){
    const key=inspectGoogleMapsApiKey(process.env.GOOGLE_MAPS_API_KEY),apiKey=key.normalizedKey;
    if(apiKey)return createGoogleRoutesProvider({apiKey});
    const reason=key.formatIssue??"INVALID_API_KEY_FORMAT",message=reason==="MISSING_API_KEY"?"GOOGLE_MAPS_API_KEY is not configured.":"GOOGLE_MAPS_API_KEY does not appear to contain a valid Google API key.";
    return Response.json({error:message,...(process.env.NODE_ENV!=="production"?{status:"travel_unavailable",provider:"google_routes",reason,apiKeyDetected:key.apiKeyDetected}:{})},{status:503,headers:{"cache-control":"no-store"}});
  }
  const token=process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if(token)return createMapboxDirectionsProvider({accessToken:token});
  return Response.json({error:"MAPBOX_ACCESS_TOKEN is not configured.",...(process.env.NODE_ENV!=="production"?{status:"travel_unavailable",provider:"mapbox",reason:"MISSING_MAPBOX_TOKEN",tokenDetected:false}:{})},{status:503,headers:{"cache-control":"no-store"}});
}

export async function POST(request:Request){
  let input:Partial<TravelRequest>;try{input=await request.json() as Partial<TravelRequest>}catch{return Response.json({error:"Invalid travel request"},{status:400})}
  if(typeof input.origin!=="string"||!input.origin.trim()||input.origin.length>300||typeof input.destination!=="string"||!input.destination.trim()||input.destination.length>300||!input.mode||!MODES.has(input.mode))return Response.json({error:"A valid origin, destination, and travel mode are required"},{status:400});
  const name=providerName();
  if(name==="mapbox"&&input.mode==="transit")return Response.json({error:"Public transit routing is not supported yet.",status:"travel_unavailable",provider:"mapbox",reason:"TRANSIT_NOT_SUPPORTED"},{status:422,headers:{"cache-control":"no-store"}});
  const provider=selectedProvider(name);if(provider instanceof Response){if(process.env.NODE_ENV!=="production")console.error("Travel request not sent",{provider:name,reason:name==="mapbox"?"MISSING_MAPBOX_TOKEN":"GOOGLE_KEY_UNAVAILABLE",tokenDetected:name==="mapbox"?false:undefined,...logContext(input.mode)});return provider}
  try{const travel=await provider.getTravelTime({origin:input.origin.trim(),destination:input.destination.trim(),mode:input.mode,...(typeof input.arrivalAt==="string"?{arrivalAt:input.arrivalAt}:{})});return Response.json(travel,{headers:{"cache-control":"no-store"}})}catch(error){if(!(error instanceof TravelProviderError))return Response.json({error:"Travel time unavailable"},{status:502,headers:{"cache-control":"no-store"}});if(process.env.NODE_ENV!=="production")console.error("Travel provider request failed",{provider:error.details.provider??name,upstreamStatus:error.details.upstreamStatus,reason:error.details.reason??"UNKNOWN",message:error.details.providerMessage??error.message,tokenDetected:name==="mapbox",...logContext(input.mode)});return Response.json({error:error.message,...developmentDetails(error)},{status:error.status,headers:{"cache-control":"no-store"}})}
}
