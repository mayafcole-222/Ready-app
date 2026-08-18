import { googleCalendarCookieCleanup } from "@/lib/calendar/google-session";

export async function GET(request:Request){
  if(process.env.NODE_ENV==="production")return Response.json({error:"Not found"},{status:404});
  const url=new URL(request.url),step=Number(url.searchParams.get("step")??"0"),cookies=googleCalendarCookieCleanup(request);
  if(!Number.isInteger(step)||step<0||step>=cookies.length)return Response.json({error:"Invalid reset step"},{status:400});
  const next=step===cookies.length-1?`${url.origin}/?calendar=reset`:`${url.origin}/api/dev/reset-google-calendar?step=${step+1}`;
  return new Response(null,{status:303,headers:{location:next,"set-cookie":cookies[step]}});
}
