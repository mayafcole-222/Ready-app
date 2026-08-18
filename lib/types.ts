export type MorningGoal = "Calm" | "Productive" | "Centered" | "Energized" | "Prepared" | "Healthy" | "Unhurried" | "Flexible";
export interface UserProfile { id:string; name:string; goals:MorningGoal[]; routines:RoutineItem[]; frictions:string[]; connectedTools:string[] }
export interface RoutineItem { id:string; name:string; timing:"morning"|"night"|"either"|"never"; priority:"must"|"usually"|"nice" }
export interface CalendarEvent { id:string; title:string; start:string; location:string; type:"work"|"presentation"|"exercise"|"social"|"home"; formality?:number }
export interface TodoistTask { id:string; title:string; dueToday:boolean; physicalItem?:string }
export interface WeatherContext { morningTemp:number; eveningTemp:number; uvIndex:number; rainAfter?:string }
export interface SleepContext { durationMinutes:number; baselineMinutes:number }
export type ClosetCategory = "Tops"|"Bottoms"|"Outerwear"|"Shoes"|"Workout"|"Bags"|"Accessories";
export interface ClosetItem { id:string; name:string; category:ClosetCategory; image:string; color:string; formality:number; warmth:number; weatherResistance:number; walkingComfort:number; activityTypes:string[]; clean:boolean; lastWorn:string }
export type RecommendationCategory = "do"|"wear"|"eat"|"bring";
export type RecommendationSource = "Weather"|"Calendar"|"Todoist"|"Closet"|"Sleep"|"Routine";
export interface Recommendation { id:string; category:RecommendationCategory; title:string; description:string; reason:string; sources:RecommendationSource[]; priority:"essential"|"helpful"|"optional"; confidence:number; completed:boolean; dismissed:boolean }
export interface JourneyStop { id:string; time:string; title:string; location:string; weather?:string; note?:string }
export interface Reflection { rating:number; wentWell:string[]; improve:string[]; note:string }
export interface DailyPlan { date:string; events:CalendarEvent[]; recommendations:Recommendation[]; stops:JourneyStop[]; sleep:SleepContext; weather:WeatherContext; pilatesCancelled:boolean }
export interface CalendarProvider { getEvents(date:string):Promise<CalendarEvent[]> } export interface TaskProvider { getTasks(date:string):Promise<TodoistTask[]> } export interface WeatherProvider { getWeather(date:string):Promise<WeatherContext> } export interface SleepProvider { getSleep(date:string):Promise<SleepContext> } export interface ClosetProvider { getItems():Promise<ClosetItem[]> }
export interface ReadyProviders { calendar:CalendarProvider; tasks:TaskProvider; weather:WeatherProvider; sleep:SleepProvider; closet:ClosetProvider }
export interface ReadyContext { events:CalendarEvent[]; tasks:TodoistTask[]; weather:WeatherContext; sleep:SleepContext; closet:ClosetItem[] }
export type RecommendationUserState = Record<string,{completed:boolean;dismissed:boolean}>;
