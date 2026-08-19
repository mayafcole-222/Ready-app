import type { Person, ReadyEvent } from "../types";

export function normalizePersonName(value:string):string{return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}
function containsWholeName(value:string,name:string){return ` ${normalizePersonName(value)} `.includes(` ${name} `)}

export function matchPeopleToEvent(event:ReadyEvent,people:Person[]):Person[]{
 const attendeeValues=event.attendees??[];
 return people.filter(person=>{const name=normalizePersonName(person.name);if(name.length<3)return false;return containsWholeName(event.title,name)||attendeeValues.some(attendee=>normalizePersonName(attendee)===name||containsWholeName(attendee,name))}).sort((a,b)=>normalizePersonName(b.name).length-normalizePersonName(a.name).length||a.id.localeCompare(b.id));
}
