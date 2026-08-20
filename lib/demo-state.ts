import { isDemoMode } from "./ready-runtime";
import type { Errand, MorningGoal, Person, SocialContextItem, TravelSettings } from "./types";

export const READY_STORAGE_KEYS=[
  "ready-onboarded",
  "ready-goals",
  "ready-preparation-state",
  "ready-custom-preparation",
  "ready-hidden-preparation",
  "ready-travel-settings",
  "ready-errands",
  "ready-errand-rejections",
  "ready-rec-state",
  "ready-recs",
  "ready-people",
  "ready-social-context",
  "ready-social-dismissals",
] as const;

const demoPerson:Person={id:"demo-jessica",name:"Jessica",relationship:"friend",interests:["turtles","fashion"],bondTopics:["reality TV","restaurants","career updates"]};
const demoContext:SocialContextItem[]=[
  {id:"demo-jessica-job",personId:demoPerson.id,type:"conversation",content:"Jessica recently started a new job and was nervous about starting.",importance:"important"},
  {id:"demo-jessica-finale",personId:demoPerson.id,type:"conversation",content:"You were talking about a TV finale.",importance:"normal"},
  {id:"demo-jessica-review",personId:demoPerson.id,type:"conversation",content:"an upcoming portfolio review",importance:"important"},
];
const demoErrands:Errand[]=[{id:"demo-mail-package",title:"Mail package",estimatedMinutes:20,location:"Post Office",priority:"normal",status:"open"}];
const demoGoals:MorningGoal[]=["Calm","Prepared","Unhurried"];
const demoTravel:TravelSettings={homeLocation:"",mode:"walking",arrivalBufferMinutes:10};

export const READY_DEMO_STORAGE:Record<string,unknown>={
  "ready-onboarded":true,
  "ready-goals":demoGoals,
  "ready-preparation-state":{},
  "ready-custom-preparation":{},
  "ready-hidden-preparation":{},
  "ready-travel-settings":demoTravel,
  "ready-errands":demoErrands,
  "ready-errand-rejections":{},
  "ready-rec-state":{},
  "ready-people":[demoPerson],
  "ready-social-context":demoContext,
  "ready-social-dismissals":{},
};

export function getReadyInitialValue<T>(key:string,fallback:T):T{
  return isDemoMode()&&key in READY_DEMO_STORAGE?structuredClone(READY_DEMO_STORAGE[key]) as T:fallback;
}

export function resetReadyDemoStorage(storage:Pick<Storage,"removeItem"|"setItem">):void{
  for(const key of READY_STORAGE_KEYS)storage.removeItem(key);
  for(const [key,value] of Object.entries(READY_DEMO_STORAGE))storage.setItem(key,JSON.stringify(value));
}
