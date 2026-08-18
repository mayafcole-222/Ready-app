const SESSION_COOKIE="ready_google_calendar";
const STATE_COOKIE="ready_google_oauth_state";
const LEGACY_RECONNECT_COOKIE="ready_google_calendar_reconnect";
const COOKIE_MAX_AGE=60*60*24*30;

export interface GoogleTokenSession { status:"connected"; sessionId:string; accessToken:string; refreshToken?:string; expiresAt:number }
export interface GoogleReconnectSession { status:"needs_reconnect"; sessionId:string }
export type GoogleCalendarSession=GoogleTokenSession|GoogleReconnectSession;

function bytesToBase64Url(bytes:Uint8Array):string{return btoa(String.fromCharCode(...bytes)).replaceAll("+","-").replaceAll("/","_").replace(/=+$/g,"")}
function base64UrlToBytes(value:string):Uint8Array{const base64=value.replaceAll("-","+").replaceAll("_","/").padEnd(Math.ceil(value.length/4)*4,"=");return Uint8Array.from(atob(base64),character=>character.charCodeAt(0))}

async function encryptionKey(secret:string):Promise<CryptoKey>{
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}

export async function sealGoogleSession(session:GoogleCalendarSession,secret:string):Promise<string>{
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},await encryptionKey(secret),new TextEncoder().encode(JSON.stringify(session)));
  const payload=new Uint8Array(iv.length+encrypted.byteLength);payload.set(iv);payload.set(new Uint8Array(encrypted),iv.length);
  return bytesToBase64Url(payload);
}

export async function unsealGoogleSession(value:string|undefined,secret:string):Promise<GoogleCalendarSession|null>{
  if(!value)return null;
  try{const payload=base64UrlToBytes(value);if(payload.length<=12)return null;const decrypted=await crypto.subtle.decrypt({name:"AES-GCM",iv:payload.slice(0,12)},await encryptionKey(secret),payload.slice(12));const parsed=JSON.parse(new TextDecoder().decode(decrypted)) as Partial<GoogleCalendarSession>;if(typeof parsed.sessionId!=="string")return null;if(parsed.status==="needs_reconnect")return parsed as GoogleReconnectSession;if(parsed.status!=="connected"||typeof parsed.accessToken!=="string"||typeof parsed.expiresAt!=="number"||(parsed.refreshToken!==undefined&&typeof parsed.refreshToken!=="string"))return null;return parsed as GoogleTokenSession}catch{return null}
}

export function readCookie(request:Request,name:string):string|undefined{
  return request.headers.get("cookie")?.split(";").map(part=>part.trim()).find(part=>part.startsWith(`${name}=`))?.slice(name.length+1);
}

function cookieSecurity(request:Request):string{return new URL(request.url).protocol==="https:"?"; Secure":""}
export function googleSessionCookie(request:Request,value:string):string{return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${cookieSecurity(request)}`}
export function clearGoogleSessionCookie(request:Request):string{return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecurity(request)}`}
export function googleStateCookie(request:Request,value:string):string{return `${STATE_COOKIE}=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${cookieSecurity(request)}`}
export function clearGoogleStateCookie(request:Request):string{return `${STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecurity(request)}`}
export function clearLegacyGoogleStateCookie(request:Request):string{return `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecurity(request)}`}
export function clearLegacyGoogleReconnectCookie(request:Request):string{return `${LEGACY_RECONNECT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecurity(request)}`}
export function readGoogleSessionCookie(request:Request):string|undefined{return readCookie(request,SESSION_COOKIE)}
export function readGoogleStateCookie(request:Request):string|undefined{return readCookie(request,STATE_COOKIE)}
export function googleCalendarCookieCleanup(request:Request):string[]{return [clearGoogleSessionCookie(request),clearGoogleStateCookie(request),clearLegacyGoogleStateCookie(request),clearLegacyGoogleReconnectCookie(request)]}
