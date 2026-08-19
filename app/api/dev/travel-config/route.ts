import { inspectGoogleMapsApiKey } from "@/lib/travel/google-api-key";

export async function GET(){if(process.env.NODE_ENV==="production")return new Response(null,{status:404});const key=inspectGoogleMapsApiKey(process.env.GOOGLE_MAPS_API_KEY);return Response.json({source:".env.local",apiKeyDetected:key.apiKeyDetected,apiKeyLooksValid:key.apiKeyLooksValid,apiKeyLength:key.apiKeyLength,apiKeyPrefix:key.apiKeyPrefix,routesProvider:"google"},{headers:{"cache-control":"no-store"}})}
