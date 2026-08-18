import { exchangeGoogleCode, googleCredentials, googleRedirectUri } from "@/lib/calendar/google-oauth";
import { clearGoogleStateCookie, googleSessionCookie, readGoogleStateCookie, sealGoogleSession } from "@/lib/calendar/google-session";

function redirectHome(request:Request,result:string,cookie?:string){return new Response(null,{status:302,headers:{location:`${new URL(request.url).origin}/?calendar=${result}`,...(cookie?{"set-cookie":cookie}:{})}})}

export async function GET(request:Request){
  const url=new URL(request.url),expectedState=readGoogleStateCookie(request),state=url.searchParams.get("state");const clearState=clearGoogleStateCookie(request);
  if(!state||!expectedState||state!==expectedState)return Response.json({error:"Invalid Google OAuth state"},{status:400,headers:{"set-cookie":clearState}});
  if(url.searchParams.has("error"))return redirectHome(request,"denied",clearState);
  const code=url.searchParams.get("code");if(!code)return Response.json({error:"Google OAuth code is missing"},{status:400,headers:{"set-cookie":clearState}});
  let session;
  try{session=await exchangeGoogleCode(code,googleRedirectUri(request))}catch(error){console.error("Google OAuth token exchange failed",error instanceof Error?error.message:"Unknown token exchange error");return redirectHome(request,"token_exchange_failed",clearState)}
  try{const sealed=await sealGoogleSession(session,googleCredentials().clientSecret);return redirectHome(request,"connected",googleSessionCookie(request,sealed))}catch(error){console.error("Google Calendar token persistence failed",error instanceof Error?error.message:"Unknown token persistence error");return redirectHome(request,"token_persistence_failed",clearState)}
}
