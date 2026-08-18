import type { WeatherConditionCode, WeatherContext, WeatherProvider, WeatherQuery } from "../types";

const OPEN_METEO_FORECAST_URL="https://api.open-meteo.com/v1/forecast";
const RAIN_PROBABILITY_THRESHOLD=40;
const RAIN_AMOUNT_THRESHOLD_MM=0.1;

type JsonRecord=Record<string,unknown>;

function record(value:unknown,label:string):JsonRecord{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error(`Open-Meteo response is missing ${label}`);
  return value as JsonRecord;
}

function number(value:unknown,label:string):number{
  if(typeof value!=="number"||!Number.isFinite(value))throw new Error(`Open-Meteo response has invalid ${label}`);
  return value;
}

function numberArray(value:unknown,label:string):number[]{
  if(!Array.isArray(value)||value.some(item=>typeof item!=="number"||!Number.isFinite(item)))throw new Error(`Open-Meteo response has invalid ${label}`);
  return value as number[];
}

function stringArray(value:unknown,label:string):string[]{
  if(!Array.isArray(value)||value.some(item=>typeof item!=="string"))throw new Error(`Open-Meteo response has invalid ${label}`);
  return value as string[];
}

export function normalizeWeatherCode(code:number):{conditionCode:WeatherConditionCode;currentCondition:string}{
  if(code===0)return {conditionCode:"clear",currentCondition:"Clear"};
  if(code===1)return {conditionCode:"clear",currentCondition:"Mostly clear"};
  if(code===2)return {conditionCode:"partly-cloudy",currentCondition:"Partly cloudy"};
  if(code===3)return {conditionCode:"cloudy",currentCondition:"Cloudy"};
  if(code===45||code===48)return {conditionCode:"cloudy",currentCondition:"Fog"};
  if([51,53,56,61,80].includes(code))return {conditionCode:"light-rain",currentCondition:"Light rain"};
  if([55,57,63,65,66,67,81,82].includes(code))return {conditionCode:"rain",currentCondition:"Rain"};
  if([71,73,75,77,85,86].includes(code))return {conditionCode:"snow",currentCondition:"Snow"};
  if([95,96,99].includes(code))return {conditionCode:"storms",currentCondition:"Thunderstorms"};
  throw new Error(`Open-Meteo returned unsupported weather code ${code}`);
}

function minutesFromTimestamp(timestamp:string):number{
  const match=/T(\d{2}):(\d{2})$/.exec(timestamp);
  if(!match)return Number.NaN;
  return Number(match[1])*60+Number(match[2]);
}

function nearestHourlyValue(times:string[],values:number[],date:string,targetHour:number,label:string):number{
  if(times.length!==values.length)throw new Error(`Open-Meteo response has mismatched ${label} data`);
  let bestIndex=-1,bestDistance=Number.POSITIVE_INFINITY;
  times.forEach((timestamp,index)=>{
    if(!timestamp.startsWith(`${date}T`))return;
    const minutes=minutesFromTimestamp(timestamp);
    const distance=Math.abs(minutes-targetHour*60);
    if(Number.isFinite(minutes)&&distance<bestDistance){bestIndex=index;bestDistance=distance}
  });
  if(bestIndex<0)throw new Error(`Open-Meteo response has no ${label} data for ${date}`);
  return values[bestIndex];
}

function formatHour(timestamp:string):string{
  const minutes=minutesFromTimestamp(timestamp);
  if(!Number.isFinite(minutes))throw new Error(`Open-Meteo returned invalid hourly timestamp ${timestamp}`);
  const hour=Math.floor(minutes/60),minute=minutes%60;
  return `${hour%12||12}:${String(minute).padStart(2,"0")} ${hour>=12?"PM":"AM"}`;
}

export function normalizeOpenMeteoResponse(payload:unknown,query:WeatherQuery):WeatherContext{
  const root=record(payload,"forecast data"),current=record(root.current,"current data"),hourly=record(root.hourly,"hourly data"),daily=record(root.daily,"daily data");
  const times=stringArray(hourly.time,"hourly.time"),temperatures=numberArray(hourly.temperature_2m,"hourly.temperature_2m"),probabilities=numberArray(hourly.precipitation_probability,"hourly.precipitation_probability"),precipitation=numberArray(hourly.precipitation,"hourly.precipitation");
  if(times.length!==probabilities.length||times.length!==precipitation.length)throw new Error("Open-Meteo response has mismatched precipitation data");
  const dailyTimes=stringArray(daily.time,"daily.time"),dailyIndex=dailyTimes.indexOf(query.date);
  if(dailyIndex<0)throw new Error(`Open-Meteo response has no daily data for ${query.date}`);
  const highs=numberArray(daily.temperature_2m_max,"daily.temperature_2m_max"),lows=numberArray(daily.temperature_2m_min,"daily.temperature_2m_min"),uv=numberArray(daily.uv_index_max,"daily.uv_index_max");
  if(![highs,lows,uv].every(values=>dailyIndex<values.length))throw new Error(`Open-Meteo response has incomplete daily data for ${query.date}`);
  const weatherCode=number(current.weather_code,"current.weather_code");
  const condition=normalizeWeatherCode(weatherCode);
  const rainIndex=times.findIndex((timestamp,index)=>timestamp.startsWith(`${query.date}T`)&&probabilities[index]>=RAIN_PROBABILITY_THRESHOLD&&precipitation[index]>=RAIN_AMOUNT_THRESHOLD_MM);
  return {
    currentTemp:Math.round(number(current.temperature_2m,"current.temperature_2m")),
    morningTemp:Math.round(nearestHourlyValue(times,temperatures,query.date,8,"morning temperature")),
    eveningTemp:Math.round(nearestHourlyValue(times,temperatures,query.date,20,"evening temperature")),
    highTemp:Math.round(highs[dailyIndex]),lowTemp:Math.round(lows[dailyIndex]),uvIndex:uv[dailyIndex],
    ...condition,
    ...(rainIndex>=0?{precipitationStart:formatHour(times[rainIndex])}:{}),
    location:query.location,
  };
}

export function createOpenMeteoWeatherProvider(fetcher:typeof fetch=globalThis.fetch):WeatherProvider{
  return {async getWeather(query){
    const url=new URL(OPEN_METEO_FORECAST_URL);
    url.searchParams.set("latitude",String(query.location.latitude));
    url.searchParams.set("longitude",String(query.location.longitude));
    url.searchParams.set("current","temperature_2m,weather_code");
    url.searchParams.set("hourly","temperature_2m,precipitation_probability,precipitation");
    url.searchParams.set("daily","temperature_2m_max,temperature_2m_min,uv_index_max");
    url.searchParams.set("temperature_unit","fahrenheit");
    url.searchParams.set("timezone",query.location.timezone);
    url.searchParams.set("start_date",query.date);
    url.searchParams.set("end_date",query.date);
    let response:Response;
    try{response=await fetcher(url)}catch(cause){throw new Error("Open-Meteo weather request failed",{cause})}
    if(!response.ok)throw new Error(`Open-Meteo weather request failed (${response.status})`);
    let payload:unknown;
    try{payload=await response.json()}catch(cause){throw new Error("Open-Meteo returned invalid JSON",{cause})}
    return normalizeOpenMeteoResponse(payload,query);
  }};
}

export const openMeteoWeatherProvider=createOpenMeteoWeatherProvider();
