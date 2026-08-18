export type MorningGoal = "Calm" | "Productive" | "Centered" | "Energized" | "Prepared" | "Healthy" | "Unhurried" | "Flexible";
export interface UserProfile { id:string; name:string; goals:MorningGoal[]; routines:RoutineItem[]; frictions:string[]; connectedTools:string[] }
export interface RoutineItem { id:string; name:string; timing:"morning"|"night"|"either"|"never"; priority:"must"|"usually"|"nice" }
export interface CalendarEvent { id:string; title:string; startAt:string; endAt:string; allDay:boolean; location?:string; description?:string; attendees?:string[]; meetingUrl?:string; status:"confirmed"|"tentative"|"cancelled" }
export type ReadyEventType = "work"|"presentation"|"exercise"|"social"|"home"|"unknown";
export interface ReadyEvent extends CalendarEvent { type:ReadyEventType; typeConfidence:number; typeReason:string; formality?:number; attendanceMode:"virtual"|"in_person"|"unknown" }
export interface PreparationTask { id:string; title:string; reason:string }
export type PreparationTaskState = Record<string,boolean>;
export interface TodoistTask { id:string; title:string; dueToday:boolean; physicalItem?:string }
export type WeatherConditionCode = "clear"|"partly-cloudy"|"cloudy"|"light-rain"|"rain"|"snow"|"storms";
export interface WeatherLocation { name:string; latitude:number; longitude:number; timezone:string }
export interface WeatherQuery { date:string; location:WeatherLocation }
export interface WeatherContext { currentTemp:number; morningTemp:number; eveningTemp:number; highTemp:number; lowTemp:number; uvIndex:number; currentCondition:string; conditionCode:WeatherConditionCode; precipitationStart?:string; location:WeatherLocation }
export interface SleepContext { durationMinutes:number; baselineMinutes:number }
export type ClosetCategory = "Tops"|"Bottoms"|"Outerwear"|"Shoes"|"Workout"|"Bags"|"Accessories";
export interface ClosetItem { id:string; name:string; category:ClosetCategory; image:string; color:string; formality:number; warmth:number; weatherResistance:number; walkingComfort:number; activityTypes:string[]; clean:boolean; lastWorn:string }
export type RecommendationCategory = "do"|"wear"|"eat"|"bring";
export type RecommendationSource = "Weather"|"Calendar"|"Todoist"|"Closet"|"Sleep"|"Routine";
export interface Recommendation { id:string; category:RecommendationCategory; title:string; description:string; reason:string; sources:RecommendationSource[]; priority:"essential"|"helpful"|"optional"; confidence:number; completed:boolean; dismissed:boolean }
export interface JourneyStop { id:string; time:string; title:string; location:string; weather?:string; note?:string }
export interface Reflection { rating:number; wentWell:string[]; improve:string[]; note:string }
export interface DailyPlan { date:string; events:ReadyEvent[]; recommendations:Recommendation[]; stops:JourneyStop[]; sleep:SleepContext; weather:WeatherContext; cancelledEventId?:string }
export interface CalendarProvider { getEvents(date:string):Promise<CalendarEvent[]> } export interface TaskProvider { getTasks(date:string):Promise<TodoistTask[]> } export interface WeatherProvider { getWeather(query:WeatherQuery):Promise<WeatherContext> } export interface SleepProvider { getSleep(date:string):Promise<SleepContext> } export interface ClosetProvider { getItems():Promise<ClosetItem[]> }
export interface ReadyProviders { calendar:CalendarProvider; tasks:TaskProvider; weather:WeatherProvider; sleep:SleepProvider; closet:ClosetProvider }
export interface ReadyContext { events:ReadyEvent[]; tasks:TodoistTask[]; weather:WeatherContext; sleep:SleepContext; closet:ClosetItem[] }
export type RecommendationUserState = Record<string,{completed:boolean;dismissed:boolean}>;
