import test from "node:test";
import assert from "node:assert/strict";
import { getActiveReadyDate } from "../lib/active-date";
import { createOpenMeteoWeatherProvider, normalizeWeatherCode } from "../lib/weather/open-meteo";
import type { WeatherQuery } from "../lib/types";

const query:WeatherQuery={date:"2026-08-17",location:{name:"New York, NY",latitude:40.7128,longitude:-74.006,timezone:"America/New_York"}};

function forecast(overrides:{code?:number;rainHour?:number|null}={}){
  const times=Array.from({length:24},(_,hour)=>`2026-08-17T${String(hour).padStart(2,"0")}:00`);
  const rainHour=overrides.rainHour===undefined?17:overrides.rainHour;
  return {
    current:{temperature_2m:67.6,weather_code:overrides.code??2},
    hourly:{
      time:times,
      temperature_2m:times.map((_,hour)=>50+hour),
      precipitation_probability:times.map((_,hour)=>hour===rainHour?65:10),
      precipitation:times.map((_,hour)=>hour===rainHour?0.4:0),
    },
    daily:{time:["2026-08-17"],temperature_2m_max:[79.4],temperature_2m_min:[49.6],uv_index_max:[6.8]},
  };
}

test("requests the active location, date, timezone, Fahrenheit, and required forecast fields",async()=>{
  let requested:URL|undefined;
  const provider=createOpenMeteoWeatherProvider(async input=>{requested=new URL(String(input));return new Response(JSON.stringify(forecast()))});
  const weather=await provider.getWeather(query);
  assert.equal(requested?.origin+requested?.pathname,"https://api.open-meteo.com/v1/forecast");
  assert.equal(requested?.searchParams.get("latitude"),"40.7128");
  assert.equal(requested?.searchParams.get("longitude"),"-74.006");
  assert.equal(requested?.searchParams.get("timezone"),"America/New_York");
  assert.equal(requested?.searchParams.get("temperature_unit"),"fahrenheit");
  assert.equal(requested?.searchParams.get("start_date"),query.date);
  assert.equal(requested?.searchParams.get("end_date"),query.date);
  assert.equal(requested?.searchParams.get("current"),"temperature_2m,weather_code");
  assert.equal(requested?.searchParams.get("hourly"),"temperature_2m,precipitation_probability,precipitation");
  assert.equal(requested?.searchParams.get("daily"),"temperature_2m_max,temperature_2m_min,uv_index_max");
  assert.deepEqual(weather,{currentTemp:68,morningTemp:58,eveningTemp:70,highTemp:79,lowTemp:50,uvIndex:6.8,currentCondition:"Partly cloudy",conditionCode:"partly-cloudy",precipitationStart:"5:00 PM",location:query.location});
});

test("normalizes representative WMO conditions into Ready condition codes",()=>{
  assert.deepEqual(normalizeWeatherCode(0),{conditionCode:"clear",currentCondition:"Clear"});
  assert.equal(normalizeWeatherCode(2).conditionCode,"partly-cloudy");
  assert.equal(normalizeWeatherCode(3).conditionCode,"cloudy");
  assert.equal(normalizeWeatherCode(61).conditionCode,"light-rain");
  assert.equal(normalizeWeatherCode(65).conditionCode,"rain");
  assert.equal(normalizeWeatherCode(75).conditionCode,"snow");
  assert.equal(normalizeWeatherCode(95).conditionCode,"storms");
  assert.throws(()=>normalizeWeatherCode(100),/unsupported weather code/);
});

test("omits precipitation timing for a dry forecast",async()=>{
  const provider=createOpenMeteoWeatherProvider(async()=>new Response(JSON.stringify(forecast({rainHour:null}))));
  assert.equal((await provider.getWeather(query)).precipitationStart,undefined);
});

test("throws useful errors for failed requests, invalid JSON, and missing fields",async()=>{
  await assert.rejects(createOpenMeteoWeatherProvider(async()=>new Response("unavailable",{status:503})).getWeather(query),/503/);
  await assert.rejects(createOpenMeteoWeatherProvider(async()=>new Response("not json")).getWeather(query),/invalid JSON/);
  await assert.rejects(createOpenMeteoWeatherProvider(async()=>new Response(JSON.stringify({current:{}}))).getWeather(query),/missing hourly data/);
  const missingTimes=forecast();
  missingTimes.hourly.time=[];
  await assert.rejects(createOpenMeteoWeatherProvider(async()=>new Response(JSON.stringify(missingTimes))).getWeather(query),/mismatched precipitation data/);
});

test("uses the configured timezone for the hydration-safe active date",()=>{
  const instant=new Date("2026-08-17T02:30:00Z");
  assert.equal(getActiveReadyDate("America/New_York",instant),"2026-08-16");
  assert.equal(getActiveReadyDate("Asia/Tokyo",instant),"2026-08-17");
});
