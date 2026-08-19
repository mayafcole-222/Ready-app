import type { CustomPreparationTask, CustomPreparationTaskState, HiddenPreparationTaskState } from "../types";
import { preparationStateKey } from "../calendar/preparation";

export function addCustomPreparationTask(state:CustomPreparationTaskState,eventId:string,title:string):CustomPreparationTaskState{const clean=title.trim();if(!clean)return state;const task:CustomPreparationTask={id:`custom-${Date.now()}-${clean.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`,title:clean,reason:"Added by you",category:"do",priority:3,generated:false};return {...state,[eventId]:[...(state[eventId]??[]),task]}}
export function removeCustomPreparationTask(state:CustomPreparationTaskState,eventId:string,taskId:string):CustomPreparationTaskState{return {...state,[eventId]:(state[eventId]??[]).filter(task=>task.id!==taskId)}}
export function hideGeneratedPreparationTask(state:HiddenPreparationTaskState,eventId:string,taskId:string):HiddenPreparationTaskState{return {...state,[preparationStateKey(eventId,taskId)]:true}}
export function visibleGeneratedTasks<T extends {id:string}>(tasks:T[],state:HiddenPreparationTaskState,eventId:string){return tasks.filter(task=>!state[preparationStateKey(eventId,task.id)])}
