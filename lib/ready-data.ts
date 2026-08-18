import type { ReadyContext, ReadyProviders, WeatherLocation } from "./types";
import { enrichCalendarEvents } from "./calendar/enrich-events";

export async function loadReadyContext(date:string,providers:ReadyProviders,weatherLocation:WeatherLocation):Promise<ReadyContext>{
  const [events,tasks,weather,sleep,closet]=await Promise.all([
    providers.calendar.getEvents(date),
    providers.tasks.getTasks(date),
    providers.weather.getWeather({date,location:weatherLocation}),
    providers.sleep.getSleep(date),
    providers.closet.getItems(),
  ]);
  return {events:enrichCalendarEvents(events),tasks,weather,sleep,closet};
}
