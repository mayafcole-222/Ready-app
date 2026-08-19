import type { InterestEnrichment, PeoplePrepResult, Person, ReadyEvent, SocialContextItem, SocialPrepBullet, SocialPrepCategory, SocialPrepDismissals, SocialPrepSource } from "../types";
import { matchPeopleToEvent } from "./match-people";

export const MAX_SOCIAL_PREP_BULLETS=4;
export const socialDismissalKey=(eventId:string,bulletId:string)=>`${eventId}::${bulletId}`;

function contextKind(item:SocialContextItem):SocialPrepCategory{const text=item.content.toLowerCase();if(/\b(i told|i mentioned|i shared|i said)\b/.test(text))return "they_may_ask";if(/\b(we were|we talked|we discussed|we both|together)\b/.test(text))return "shared_interest";if(/\b(nervous|worried|started|starting|planning|waiting|trying|first week|new job|surgery|birthday trip|family update)\b/.test(text))return "follow_up";return "remember"}
function cleanUserTold(content:string,person:Person){return content.replace(new RegExp(`^I (?:told|mentioned to|shared with) ${person.name}\\s*(?:that)?\\s*`,`i`),"").replace(/^I (?:told|mentioned|shared|said)\s*(?:that)?\s*/i,"").trim()||content}
function sourceFor(item:SocialContextItem):SocialPrepSource{return {kind:"social-context",ref:item.id,label:item.type==="note"?"A note you added":"Recent context you added"}}
function textFor(item:SocialContextItem,person:Person,category:SocialPrepCategory):string{
 const content=item.content.trim();
 if(category==="they_may_ask")return `You told ${person.name} about ${cleanUserTold(content,person).replace(/[.]$/,"")}, so they may ask how it went.`;
 if(category==="shared_interest"){const match=/\b(?:we were talking|we talked|we discussed)\s+about\s+(.+?)[.]?$/i.exec(content);return match?`You were talking about ${match[1].replace(/[.]$/,"")} last time.`:content}
 if(category==="follow_up"&&/\bnew job\b/i.test(content))return `Ask how the new job is going.${/\bnervous\b/i.test(content)?" They were nervous about starting.":""}`;
 const prefix=person.relationship==="colleague"?"Worth following up on: ":person.relationship==="mentor"?"Revisit their earlier advice or discussion: ":person.relationship==="family"?"Remember this personal update: ":person.relationship==="friend"?"Catch up on: ":"Remember: ";return `${prefix}${content}`;
}
function rank(item:SocialContextItem){const category=contextKind(item),categoryRank:Record<SocialPrepCategory,number>={follow_up:0,remember:1,they_may_ask:2,shared_interest:3,conversation_spark:5};return (item.importance==="important"?-20:0)+categoryRank[category]}
function normalizeTopic(value:string){return value.trim().toLocaleLowerCase()}

export function buildSocialPrep(person:Person,context:SocialContextItem[],event:ReadyEvent,dismissals:SocialPrepDismissals={},enrichments:InterestEnrichment[]=[]):PeoplePrepResult|undefined{
 const relevant=context.filter(item=>item.personId===person.id).sort((a,b)=>rank(a)-rank(b)||(b.occurredAt??"").localeCompare(a.occurredAt??"")||a.id.localeCompare(b.id));
 const bullets:SocialPrepBullet[]=relevant.map(item=>{const category=contextKind(item);return {id:`context-${item.id}`,text:textFor(item,person,category),category,sources:[sourceFor(item)]}});
 const seenTopics=new Set<string>();
 for(const topic of person.bondTopics){const normalized=normalizeTopic(topic);if(!normalized||seenTopics.has(normalized))continue;seenTopics.add(normalized);bullets.push({id:`bond-${person.id}-${normalized}`,text:`You usually connect over ${topic}.`,category:"shared_interest",sources:[{kind:"bond-topic",ref:`${person.id}:${normalized}`,label:`A shared topic you saved: ${topic}`}]})}
 for(const interest of person.interests??[]){const normalized=normalizeTopic(interest);if(!normalized||seenTopics.has(normalized))continue;seenTopics.add(normalized);const enrichment=enrichments.find(item=>normalizeTopic(item.topic)===normalized&&(item.kind==="fact"||Boolean(item.sourceLabel&&item.sourceUrl&&item.publishedAt))),sources:SocialPrepSource[]=[{kind:"person-interest",ref:`${person.id}:${normalized}`,label:`${person.name}'s interest you saved: ${interest}`}];if(enrichment)sources.push({kind:"interest-enrichment",ref:enrichment.id,label:enrichment.sourceLabel??"Ready topic enrichment",url:enrichment.sourceUrl,publishedAt:enrichment.publishedAt});bullets.push({id:`interest-${person.id}-${normalized}-${enrichment?.id??"plain"}`,text:enrichment?`${person.name} loves ${interest}. ${enrichment.text}`:`${person.name} is interested in ${interest}.`,category:"conversation_spark",sources})}
 const visible=bullets.filter(bullet=>!dismissals[socialDismissalKey(event.id,bullet.id)]).slice(0,MAX_SOCIAL_PREP_BULLETS);
 return visible.length?{person,event,bullets:visible}:undefined;
}

export function buildPeoplePrepForDay(events:ReadyEvent[],people:Person[],context:SocialContextItem[],dismissals:SocialPrepDismissals={},enrichments:InterestEnrichment[]=[],now?:number):PeoplePrepResult[]{
 return events.filter(event=>event.status!=="cancelled"&&(now===undefined||new Date(event.endAt).getTime()>now)).flatMap(event=>matchPeopleToEvent(event,people).flatMap(person=>{const result=buildSocialPrep(person,context,event,dismissals,enrichments);return result?[result]:[]})).sort((a,b)=>a.event.startAt.localeCompare(b.event.startAt)||a.event.id.localeCompare(b.event.id)||a.person.id.localeCompare(b.person.id));
}

// A future generator may improve phrasing, but every output must retain
// explicit sources and may not introduce unsupported personal facts.
