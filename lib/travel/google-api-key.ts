export interface GoogleApiKeyMetadata { apiKeyDetected:boolean; apiKeyLooksValid:boolean; apiKeyLength:number; apiKeyPrefix:string; normalizedKey?:string; formatIssue?:"MISSING_API_KEY"|"QUOTED_API_KEY"|"INVALID_API_KEY_FORMAT" }

export function inspectGoogleMapsApiKey(raw:string|undefined):GoogleApiKeyMetadata{
  if(!raw||!raw.trim())return {apiKeyDetected:false,apiKeyLooksValid:false,apiKeyLength:0,apiKeyPrefix:"",formatIssue:"MISSING_API_KEY"};
  const trimmed=raw.trim(),quoted=(trimmed.startsWith('"')&&trimmed.endsWith('"'))||(trimmed.startsWith("'")&&trimmed.endsWith("'")),candidate=quoted?trimmed.slice(1,-1):trimmed,valid=/^AIza[A-Za-z0-9_-]{35}$/.test(candidate);
  return {apiKeyDetected:true,apiKeyLooksValid:valid,apiKeyLength:candidate.length,apiKeyPrefix:candidate.slice(0,4),...(valid&&!quoted?{normalizedKey:candidate}:{}),...(!valid||quoted?{formatIssue:quoted?"QUOTED_API_KEY":"INVALID_API_KEY_FORMAT" as const}:{})};
}
