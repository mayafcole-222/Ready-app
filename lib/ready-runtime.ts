import { readyDateTime } from "./calendar/day-boundaries";

export type ReadyRuntimeMode="demo"|"live";

export function getReadyRuntimeMode():ReadyRuntimeMode{
  if(process.env.NEXT_PUBLIC_READY_RUNTIME_MODE==="live"||process.env.NEXT_PUBLIC_DEMO_MODE==="false")return "live";
  return "demo";
}

export function isDemoMode():boolean{return getReadyRuntimeMode()==="demo"}

export function getReadyNow(activeDate:string,timezone:string):Date{
  return isDemoMode()?new Date(readyDateTime(activeDate,"08:15",timezone)):new Date();
}
