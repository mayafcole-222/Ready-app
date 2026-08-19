import type { PreparationTask } from "../types";

const ALIASES:Record<string,string>={"bring-laptop":"laptop","pack-laptop":"laptop","charge-device":"charge-laptop","review-notes":"review-agenda","meeting-notes":"review-agenda"};
export function canonicalPreparationTaskId(id:string){return ALIASES[id]??id}
export function prioritizePreparationTasks(tasks:PreparationTask[],limit=6){const seen=new Set<string>();return [...tasks].sort((a,b)=>a.priority-b.priority).filter(task=>{const id=canonicalPreparationTaskId(task.id);if(seen.has(id))return false;seen.add(id);return true}).slice(0,limit)}
