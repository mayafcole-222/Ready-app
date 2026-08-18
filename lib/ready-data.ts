import type { ReadyContext, ReadyProviders } from "./types";

export async function loadReadyContext(date:string,providers:ReadyProviders):Promise<ReadyContext>{
  const [events,tasks,weather,sleep,closet]=await Promise.all([
    providers.calendar.getEvents(date),
    providers.tasks.getTasks(date),
    providers.weather.getWeather(date),
    providers.sleep.getSleep(date),
    providers.closet.getItems(),
  ]);
  return {events,tasks,weather,sleep,closet};
}
