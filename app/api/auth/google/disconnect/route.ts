import { googleCalendarCookieCleanup } from "@/lib/calendar/google-session";

function disconnected(request:Request){const headers=new Headers({"content-type":"application/json"});for(const cookie of googleCalendarCookieCleanup(request))headers.append("set-cookie",cookie);return new Response(JSON.stringify({status:"disconnected"}),{status:200,headers})}
export async function GET(request:Request){return disconnected(request)}
export async function POST(request:Request){return disconnected(request)}
export async function DELETE(request:Request){return disconnected(request)}
