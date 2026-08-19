import type { ReadyContext, ReadyProviders, WeatherLocation } from "./types";
import { enrichCalendarEvents } from "./calendar/enrich-events";

export async function loadReadyContext(date:string,providers:ReadyProviders,weatherLocation:WeatherLocation):Promise<ReadyContext>{
  const [events,tasks,weatherResult,sleep,closet]=await Promise.all([
    providers.calendar.getEvents(date),
    providers.tasks.getTasks(date),
    providers.weather.getWeather({date,location:weatherLocation}).catch(error=>error instanceof Error?error:new Error("Weather unavailable")),
    providers.sleep.getSleep(date),
    providers.closet.getItems(),
  ]);
  const weather=weatherResult instanceof Error?{currentTemp:0,morningTemp:0,eveningTemp:0,highTemp:0,lowTemp:0,uvIndex:0,currentCondition:"Weather unavailable",conditionCode:"cloudy" as const,location:weatherLocation,available:false}:weatherResult;
  return {events:enrichCalendarEvents(events),tasks,weather,sleep,closet};
}
