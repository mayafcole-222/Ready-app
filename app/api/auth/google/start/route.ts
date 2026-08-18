import { GOOGLE_CALENDAR_SCOPE, googleCredentials, googleRedirectUri } from "@/lib/calendar/google-oauth";
import { googleStateCookie } from "@/lib/calendar/google-session";

export async function GET(request:Request){
  if(process.env.NEXT_PUBLIC_READY_CALENDAR_MODE!=="live")return Response.json({error:"Live Google Calendar mode is not enabled"},{status:404});
  let credentials:{clientId:string;clientSecret:string};try{credentials=googleCredentials()}catch{return Response.json({error:"Google Calendar OAuth is not configured"},{status:503})}
  const state=crypto.randomUUID();const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id",credentials.clientId);url.searchParams.set("redirect_uri",googleRedirectUri(request));url.searchParams.set("response_type","code");url.searchParams.set("scope",GOOGLE_CALENDAR_SCOPE);url.searchParams.set("access_type","offline");url.searchParams.set("prompt","consent");url.searchParams.set("include_granted_scopes","true");url.searchParams.set("state",state);
  return new Response(null,{status:302,headers:{location:url.toString(),"set-cookie":googleStateCookie(request,state)}});
}
