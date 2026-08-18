import { demoWeatherLocation } from "@/lib/ready-config";
import { createGoogleCalendarProvider, GoogleCalendarApiError } from "@/lib/calendar/google-calendar";
import { GoogleAuthorizationError, googleCredentials, validGoogleAccessToken } from "@/lib/calendar/google-oauth";
import { googleSessionCookie, readGoogleSessionCookie, sealGoogleSession, unsealGoogleSession } from "@/lib/calendar/google-session";

const AUTHORIZATION_REASONS=new Set(["authError","insufficientPermissions","invalidCredentials"]);
const DEVELOPMENT_REASONS:Record<string,string>={
  accessNotConfigured:"Google Calendar API is not enabled for the Google Cloud project used by this OAuth client.",
  API_KEY_SERVICE_BLOCKED:"Google Calendar API is blocked for this Google Cloud project.",
  PERMISSION_DENIED:"Google denied the Calendar API request. Verify that the Calendar API is enabled for the OAuth client's project.",
  SERVICE_DISABLED:"Google Calendar API is disabled for the Google Cloud project used by this OAuth client.",
  rateLimitExceeded:"Google Calendar's request limit was reached. Try again shortly.",
  userRateLimitExceeded:"Google Calendar's per-user request limit was reached. Try again shortly.",
};
function developmentCalendarError(error:unknown){if(process.env.NODE_ENV==="production"||!(error instanceof GoogleCalendarApiError))return {};const reason=error.reason??"unknown";return {reason,message:DEVELOPMENT_REASONS[reason]??`Google Calendar returned ${error.status} (${reason}).`}}
async function reconnectResponse(request:Request,sessionId:string,secret:string){const marker=await sealGoogleSession({status:"needs_reconnect",sessionId},secret);return new Response(JSON.stringify({status:"needs_reconnect"}),{status:401,headers:{"content-type":"application/json","cache-control":"no-store","set-cookie":googleSessionCookie(request,marker)}})}

export async function GET(request:Request){
  if(process.env.NEXT_PUBLIC_READY_CALENDAR_MODE!=="live")return Response.json({error:"Live Google Calendar mode is not enabled"},{status:404});
  const date=new URL(request.url).searchParams.get("date");if(!date)return Response.json({error:"A Ready date is required"},{status:400});
  let secret:string;try{secret=googleCredentials().clientSecret}catch{return Response.json({error:"Google Calendar OAuth is not configured"},{status:503})}
  const session=await unsealGoogleSession(readGoogleSessionCookie(request),secret);if(!session)return Response.json({status:"disconnected"},{status:401});
  if(session.status==="needs_reconnect")return Response.json({status:"needs_reconnect"},{status:401});
  let refreshed=false;
  try{const provider=createGoogleCalendarProvider({timezone:demoWeatherLocation.timezone,getAccessToken:async()=>{const token=await validGoogleAccessToken(session);refreshed ||= token.refreshed;return token.accessToken}});const events=await provider.getEvents(date);const headers=new Headers({"content-type":"application/json","cache-control":"no-store"});if(refreshed)headers.set("set-cookie",googleSessionCookie(request,await sealGoogleSession(session,secret)));return new Response(JSON.stringify({events}),{status:200,headers})}catch(error){if(error instanceof GoogleAuthorizationError||(error instanceof GoogleCalendarApiError&&(error.status===401||(error.status===403&&Boolean(error.reason&&AUTHORIZATION_REASONS.has(error.reason))))))return reconnectResponse(request,session.sessionId,secret);console.error("Google Calendar event fetch failed",error instanceof GoogleCalendarApiError?{status:error.status,reason:error.reason??"unknown",message:error.message}:error instanceof Error?error.message:"Unknown Calendar API error");return Response.json({error:"Google Calendar could not be loaded",...developmentCalendarError(error)},{status:502,headers:{"cache-control":"no-store"}})}
}
