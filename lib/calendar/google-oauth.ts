import type { GoogleTokenSession } from "./google-session";

export const GOOGLE_CALENDAR_SCOPE="https://www.googleapis.com/auth/calendar.events.readonly";
const GOOGLE_TOKEN_URL="https://oauth2.googleapis.com/token";

export class GoogleAuthorizationError extends Error{constructor(message="Google Calendar authorization needs to be renewed"){super(message);this.name="GoogleAuthorizationError"}}

export function googleCredentials(){const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET;if(!clientId||!clientSecret)throw new Error("Google Calendar OAuth is not configured");return {clientId,clientSecret}}

export function googleRedirectUri(request:Request):string{return process.env.GOOGLE_REDIRECT_URI||`${new URL(request.url).origin}/api/auth/google/callback`}

export async function exchangeGoogleCode(code:string,redirectUri:string,fetcher:typeof fetch=globalThis.fetch):Promise<GoogleTokenSession>{
  const {clientId,clientSecret}=googleCredentials();
  const response=await fetcher(GOOGLE_TOKEN_URL,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirectUri,grant_type:"authorization_code"})});
  if(!response.ok)throw new GoogleAuthorizationError(`Google OAuth token exchange failed (${response.status})`);
  const payload=await response.json() as {access_token?:unknown;refresh_token?:unknown;expires_in?:unknown};
  if(typeof payload.access_token!=="string"||typeof payload.expires_in!=="number")throw new GoogleAuthorizationError("Google OAuth returned malformed token data");
  if(typeof payload.refresh_token!=="string")throw new GoogleAuthorizationError("Google OAuth did not return the refresh token required for a persistent Calendar connection");
  return {status:"connected",sessionId:crypto.randomUUID(),accessToken:payload.access_token,refreshToken:payload.refresh_token,expiresAt:Date.now()+payload.expires_in*1000};
}

export async function validGoogleAccessToken(session:GoogleTokenSession,fetcher:typeof fetch=globalThis.fetch):Promise<{accessToken:string;refreshed:boolean}>{
  if(session.expiresAt>Date.now()+60_000)return {accessToken:session.accessToken,refreshed:false};
  if(!session.refreshToken)throw new GoogleAuthorizationError();
  const {clientId,clientSecret}=googleCredentials();
  const response=await fetcher(GOOGLE_TOKEN_URL,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:session.refreshToken,grant_type:"refresh_token"})});
  if(!response.ok)throw new GoogleAuthorizationError(`Google OAuth refresh failed (${response.status})`);
  const payload=await response.json() as {access_token?:unknown;expires_in?:unknown};
  if(typeof payload.access_token!=="string"||typeof payload.expires_in!=="number")throw new GoogleAuthorizationError("Google OAuth refresh returned malformed token data");
  session.accessToken=payload.access_token;session.expiresAt=Date.now()+payload.expires_in*1000;
  return {accessToken:session.accessToken,refreshed:true};
}
