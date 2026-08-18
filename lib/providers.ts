import {closet,events,sleep,tasks,weather} from "./demo-data"; import type {CalendarProvider,ClosetProvider,ReadyProviders,SleepProvider,TaskProvider,WeatherProvider} from "./types";
import {openMeteoWeatherProvider} from "./weather/open-meteo";
export const mockCalendarProvider:CalendarProvider={async getEvents(){return events}}; export const mockTaskProvider:TaskProvider={async getTasks(){return tasks}}; export const mockWeatherProvider:WeatherProvider={async getWeather(query){return {...weather,location:query.location}}}; export const mockSleepProvider:SleepProvider={async getSleep(){return sleep}}; export const mockClosetProvider:ClosetProvider={async getItems(){return closet}};
export const mockReadyProviders:ReadyProviders={calendar:mockCalendarProvider,tasks:mockTaskProvider,weather:mockWeatherProvider,sleep:mockSleepProvider,closet:mockClosetProvider};
export const liveReadyProviders:ReadyProviders={...mockReadyProviders,weather:openMeteoWeatherProvider};
export const readyProviders:ReadyProviders=process.env.NEXT_PUBLIC_READY_WEATHER_MODE==="live"?liveReadyProviders:mockReadyProviders;
