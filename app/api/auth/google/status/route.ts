import { googleCredentials } from "@/lib/calendar/google-oauth";
import { readGoogleSessionCookie, unsealGoogleSession } from "@/lib/calendar/google-session";

export async function GET(request:Request){
  const response=(status:string)=>Response.json({status},{headers:{"cache-control":"no-store"}});
  if(process.env.NEXT_PUBLIC_READY_CALENDAR_MODE!=="live")return response("mock");
  try{const session=await unsealGoogleSession(readGoogleSessionCookie(request),googleCredentials().clientSecret);if(!session)return response("disconnected");if(session.status==="connected"&&session.expiresAt<=Date.now()+60_000&&!session.refreshToken)return response("needs_reconnect");return response(session.status)}catch{return response("disconnected")}
}
