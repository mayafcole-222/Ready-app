import test from "node:test";
import assert from "node:assert/strict";
import { buildRecommendations } from "../lib/engine";
import { loadReadyContext } from "../lib/ready-data";
import type { ReadyProviders } from "../lib/types";

function providerFixture(){
  const calls:string[]=[];
  const providers:ReadyProviders={
    calendar:{async getEvents(date){calls.push(`calendar:${date}`);return [{id:"work",title:"Work",start:"9:00 AM",location:"Studio",type:"work"}]}},
    tasks:{async getTasks(date){calls.push(`tasks:${date}`);return [{id:"sample",title:"Bring sample",dueToday:true,physicalItem:"sample"}]}},
    weather:{async getWeather(date){calls.push(`weather:${date}`);return {morningTemp:60,eveningTemp:52,uvIndex:7}}},
    sleep:{async getSleep(date){calls.push(`sleep:${date}`);return {durationMinutes:420,baselineMinutes:440}}},
    closet:{async getItems(){calls.push("closet");return [{id:"shirt",name:"Blue shirt",category:"Tops",image:"",color:"Blue",formality:3,warmth:2,weatherResistance:1,walkingComfort:4,activityTypes:["work"],clean:true,lastWorn:"2026-08-10"}]}},
  };
  return {calls,providers};
}

test("loads all five providers into one normalized Ready context",async()=>{
  const {calls,providers}=providerFixture();
  const context=await loadReadyContext("2026-08-17",providers);
  assert.deepEqual(calls.sort(),["calendar:2026-08-17","closet","sleep:2026-08-17","tasks:2026-08-17","weather:2026-08-17"]);
  assert.equal(context.events[0].id,"work");
  assert.equal(context.tasks[0].id,"sample");
  assert.equal(context.weather.uvIndex,7);
  assert.equal(context.sleep.durationMinutes,420);
  assert.equal(context.closet[0].name,"Blue shirt");
  assert.ok(buildRecommendations(context.events,context.tasks,context.weather,context.sleep).some(r=>r.id==="sample"));
});

test("rejects when a provider fails so the UI can show its error state",async()=>{
  const {providers}=providerFixture();
  providers.weather.getWeather=async()=>{throw new Error("weather unavailable")};
  await assert.rejects(loadReadyContext("2026-08-17",providers),/weather unavailable/);
});
