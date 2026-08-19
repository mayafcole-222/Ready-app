export type MorningGoal = "Calm" | "Productive" | "Centered" | "Energized" | "Prepared" | "Healthy" | "Unhurried" | "Flexible";
export interface UserProfile { id:string; name:string; goals:MorningGoal[]; routines:RoutineItem[]; frictions:string[]; connectedTools:string[] }
export interface RoutineItem { id:string; name:string; timing:"morning"|"night"|"either"|"never"; priority:"must"|"usually"|"nice" }
export interface CalendarEvent { id:string; title:string; startAt:string; endAt:string; allDay:boolean; location?:string; description?:string; attendees?:string[]; meetingUrl?:string; status:"confirmed"|"tentative"|"cancelled" }
export type ReadyEventType = "work"|"presentation"|"exercise"|"social"|"home"|"unknown";
export type ReadyEventCategory = "class"|"presentation"|"critique"|"coffee_chat"|"interview"|"meeting"|"virtual_meeting"|"workout"|"social"|"appointment"|"travel"|"study"|"unknown";
export interface ReadyEvent extends CalendarEvent { type:ReadyEventType; typeConfidence:number; typeReason:string; category:ReadyEventCategory; categoryConfidence:number; categoryReason:string; formality?:number; attendanceMode:"virtual"|"in_person"|"unknown" }
export type PrepTaskCategory = "bring"|"review"|"do"|"weather"|"timing";
export interface PreparationTask { id:string; title:string; reason:string; category:PrepTaskCategory; priority:number; generated:boolean }
export interface CustomPreparationTask extends PreparationTask { generated:false }
export type PreparationTaskState = Record<string,boolean>;
export type CustomPreparationTaskState = Record<string,CustomPreparationTask[]>;
export type HiddenPreparationTaskState = Record<string,boolean>;
export type TravelMode = "walking"|"driving"|"transit"|"cycling";
export interface TravelSettings { homeLocation:string; mode:TravelMode; arrivalBufferMinutes:number }
export interface TravelRequest { origin:string; destination:string; mode:TravelMode; arrivalAt?:string }
export interface TravelContext { origin:string; destination:string; mode:TravelMode; durationMinutes:number; distance?:string }
export interface TravelProvider { getTravelTime(request:TravelRequest):Promise<TravelContext> }
export interface TodoistTask { id:string; title:string; dueToday:boolean; physicalItem?:string }
export type ErrandPriority = "low"|"normal"|"high";
export interface Errand { id:string; title:string; estimatedMinutes:number; location?:string; earliestStart?:string; completeBy?:string; priority:ErrandPriority; status:"open"|"completed" }
export interface SuggestedErrandSlot { errandId:string; startAt?:string; endAt?:string; beforeEventId?:string; afterEventId?:string; reason:string; status:"scheduled"|"no-fit" }
export type RejectedErrandSlots = Record<string,string[]>;
export type RelationshipType = "friend"|"family"|"colleague"|"manager"|"mentor"|"classmate"|"professional"|"date"|"other";
export interface Person { id:string; name:string; relationship:RelationshipType; customRelationship?:string; interests:string[]; bondTopics:string[]; notes?:string }
export type SocialContextType = "message"|"email"|"conversation"|"note";
export interface SocialContextItem { id:string; personId:string; type:SocialContextType; content:string; occurredAt?:string; importance:"normal"|"important" }
export type SocialPrepCategory = "follow_up"|"shared_interest"|"they_may_ask"|"remember"|"conversation_spark";
export type SocialPrepSourceKind = "relationship"|"person-interest"|"bond-topic"|"social-context"|"interest-enrichment";
export interface SocialPrepSource { kind:SocialPrepSourceKind; label:string; ref:string; url?:string; publishedAt?:string }
export interface SocialPrepBullet { id:string; text:string; category:SocialPrepCategory; sources:SocialPrepSource[] }
export interface PeoplePrepResult { person:Person; event:ReadyEvent; bullets:SocialPrepBullet[] }
export type SocialPrepDismissals = Record<string,boolean>;
export interface SocialContextProvider { getPeople():Promise<Person[]>; getContext(personIds:string[]):Promise<SocialContextItem[]> }
export interface InterestEnrichment { id:string; topic:string; kind:"fact"|"recent-update"; text:string; sourceLabel?:string; sourceUrl?:string; publishedAt?:string }
export interface InterestEnrichmentProvider { getEnrichments(topics:string[]):Promise<InterestEnrichment[]> }
export type WeatherConditionCode = "clear"|"partly-cloudy"|"cloudy"|"light-rain"|"rain"|"snow"|"storms";
export interface WeatherLocation { name:string; latitude:number; longitude:number; timezone:string }
export interface WeatherQuery { date:string; location:WeatherLocation }
export interface WeatherContext { currentTemp:number; morningTemp:number; eveningTemp:number; highTemp:number; lowTemp:number; uvIndex:number; currentCondition:string; conditionCode:WeatherConditionCode; precipitationStart?:string; location:WeatherLocation; available?:boolean }
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
