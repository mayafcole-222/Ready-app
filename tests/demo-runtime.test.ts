import assert from "node:assert/strict";
import test from "node:test";
import { getReadyInitialValue, READY_STORAGE_KEYS, resetReadyDemoStorage } from "../lib/demo-state";
import { getReadyNow, getReadyRuntimeMode } from "../lib/ready-runtime";

class MemoryStorage {
  values=new Map<string,string>();
  getItem(key:string){return this.values.get(key)??null}
  removeItem(key:string){this.values.delete(key)}
  setItem(key:string,value:string){this.values.set(key,value)}
}

function withRuntime(value:string|undefined,run:()=>void){
  const previous=process.env.NEXT_PUBLIC_READY_RUNTIME_MODE;
  if(value===undefined)delete process.env.NEXT_PUBLIC_READY_RUNTIME_MODE;
  else process.env.NEXT_PUBLIC_READY_RUNTIME_MODE=value;
  try{run()}finally{if(previous===undefined)delete process.env.NEXT_PUBLIC_READY_RUNTIME_MODE;else process.env.NEXT_PUBLIC_READY_RUNTIME_MODE=previous}
}

test("demo is the safe default and uses a deterministic morning clock",()=>withRuntime(undefined,()=>{
  assert.equal(getReadyRuntimeMode(),"demo");
  assert.equal(getReadyNow("2026-08-19","America/New_York").toISOString(),"2026-08-19T12:15:00.000Z");
}));

test("live mode uses the real clock path",()=>withRuntime("live",()=>{
  assert.equal(getReadyRuntimeMode(),"live");
  assert.ok(Math.abs(Date.now()-getReadyNow("2026-08-19","America/New_York").getTime())<1_000);
}));

test("demo reset clears only Ready keys and restores the canonical baseline",()=>withRuntime("demo",()=>{
  const storage=new MemoryStorage();
  for(const key of READY_STORAGE_KEYS)storage.setItem(key,JSON.stringify({stale:true}));
  storage.setItem("unrelated-key","keep me");
  resetReadyDemoStorage(storage);
  assert.equal(storage.getItem("unrelated-key"),"keep me");
  assert.equal(storage.getItem("ready-recs"),null);
  assert.equal(JSON.parse(storage.getItem("ready-onboarded")!),true);
  assert.deepEqual(JSON.parse(storage.getItem("ready-errands")!).map((item:{title:string})=>item.title),["Mail package"]);
  assert.deepEqual(JSON.parse(storage.getItem("ready-people")!).map((item:{name:string})=>item.name),["Jessica"]);
}));

test("fresh demo state starts onboarded without affecting live defaults",()=>{
  withRuntime("demo",()=>assert.equal(getReadyInitialValue("ready-onboarded",false),true));
  withRuntime("live",()=>assert.equal(getReadyInitialValue("ready-onboarded",false),false));
});
