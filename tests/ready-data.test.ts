import test from "node:test";
import assert from "node:assert/strict";
import { buildRecommendations } from "../lib/engine";
import { mockReadyProviders } from "../lib/providers";
import { demoWeatherLocation } from "../lib/ready-config";
import { loadReadyContext } from "../lib/ready-data";
import type { ReadyProviders } from "../lib/types";

function providerFixture(){
  const calls:string[]=[];
  const providers:ReadyProviders={
    calendar:{async getEvents(date){calls.push(`calendar:${date}`);return [{id:"arbitrary-provider-id",title:"Team planning meeting",startAt:`${date}T09:00:00-04:00`,endAt:`${date}T10:00:00-04:00`,allDay:false,location:"Studio",status:"confirmed"}]}},
    tasks:{async getTasks(date){calls.push(`tasks:${date}`);return [{id:"sample",title:"Bring sample",dueToday:true,physicalItem:"sample"}]}},
    weather:{async getWeather(query){calls.push(`weather:${query.date}`);return {currentTemp:60,morningTemp:60,eveningTemp:52,highTemp:68,lowTemp:50,uvIndex:7,currentCondition:"Bright",conditionCode:"clear",precipitationStart:"6:00 PM",location:query.location}}},
    sleep:{async getSleep(date){calls.push(`sleep:${date}`);return {durationMinutes:420,baselineMinutes:440}}},
    closet:{async getItems(){calls.push("closet");return [{id:"shirt",name:"Blue shirt",category:"Tops",image:"",color:"Blue",formality:3,warmth:2,weatherResistance:1,walkingComfort:4,activityTypes:["work"],clean:true,lastWorn:"2026-08-10"}]}},
  };
  return {calls,providers};
}

test("loads all five providers into one normalized Ready context",async()=>{
  const {calls,providers}=providerFixture();
  const context=await loadReadyContext("2026-08-17",providers,demoWeatherLocation);
  assert.deepEqual(calls.sort(),["calendar:2026-08-17","closet","sleep:2026-08-17","tasks:2026-08-17","weather:2026-08-17"]);
  assert.equal(context.events[0].id,"arbitrary-provider-id");
  assert.equal(context.events[0].type,"work");
  assert.equal(context.tasks[0].id,"sample");
  assert.equal(context.weather.uvIndex,7);
  assert.equal(context.sleep.durationMinutes,420);
  assert.equal(context.closet[0].name,"Blue shirt");
  assert.ok(buildRecommendations(context.events,context.tasks,context.weather,context.sleep).some(r=>r.id==="sample"));
});

test("keeps calendar preparation available when weather fails",async()=>{
  const {providers}=providerFixture();
  providers.weather.getWeather=async()=>{throw new Error("weather unavailable")};
  const context=await loadReadyContext("2026-08-17",providers,demoWeatherLocation);
  assert.equal(context.events[0].id,"arbitrary-provider-id");
  assert.equal(context.weather.available,false);
  assert.equal(buildRecommendations(context.events,context.tasks,context.weather,context.sleep).some(rec=>rec.sources.includes("Weather")),false);
});

test("mock weather provider returns normalized weather and location",async()=>{
  const context=await loadReadyContext("2026-08-17",mockReadyProviders,demoWeatherLocation);
  assert.equal(context.weather.currentCondition,"Bright start");
  assert.equal(context.weather.conditionCode,"clear");
  assert.deepEqual(context.weather.location,demoWeatherLocation);
});
