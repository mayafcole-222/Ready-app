import {closet,demoCalendarEvents,sleep,tasks,weather} from "./demo-data"; import type {CalendarProvider,ClosetProvider,ReadyProviders,SleepProvider,TaskProvider,WeatherProvider} from "./types";
import {apiCalendarProvider} from "./calendar/api-calendar";
import {openMeteoWeatherProvider} from "./weather/open-meteo";
export const mockCalendarProvider:CalendarProvider={async getEvents(date){return demoCalendarEvents(date)}}; export const mockTaskProvider:TaskProvider={async getTasks(){return tasks}}; export const mockWeatherProvider:WeatherProvider={async getWeather(query){return {...weather,location:query.location}}}; export const mockSleepProvider:SleepProvider={async getSleep(){return sleep}}; export const mockClosetProvider:ClosetProvider={async getItems(){return closet}};
export const mockReadyProviders:ReadyProviders={calendar:mockCalendarProvider,tasks:mockTaskProvider,weather:mockWeatherProvider,sleep:mockSleepProvider,closet:mockClosetProvider};
export const liveReadyProviders:ReadyProviders={...mockReadyProviders,weather:openMeteoWeatherProvider};
const selectedCalendarProvider=process.env.NEXT_PUBLIC_READY_CALENDAR_MODE==="live"?apiCalendarProvider:mockCalendarProvider;
const selectedWeatherProvider=process.env.NEXT_PUBLIC_READY_WEATHER_MODE==="live"?openMeteoWeatherProvider:mockWeatherProvider;
export const readyProviders:ReadyProviders={...mockReadyProviders,calendar:selectedCalendarProvider,weather:selectedWeatherProvider};
