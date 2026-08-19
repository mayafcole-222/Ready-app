import type { InterestEnrichment, InterestEnrichmentProvider } from "../types";

// Intentionally tiny: these are maintained demo facts, not simulated live news.
export const curatedInterestEnrichments:InterestEnrichment[]=[
 {id:"turtles-magnetic-navigation",topic:"turtles",kind:"fact",text:"Sea turtles can use Earth's magnetic field as part of navigation.",sourceLabel:"Ready curated topic fact"},
 {id:"fashion-pocket-history",topic:"fashion",kind:"fact",text:"Pockets became common in men's clothing before they were routinely built into women's clothing.",sourceLabel:"Ready curated topic fact"},
];

function normalizeTopic(value:string){return value.trim().toLocaleLowerCase()}

export const curatedFactProvider:InterestEnrichmentProvider={
 async getEnrichments(topics){const wanted=new Set(topics.map(normalizeTopic));return curatedInterestEnrichments.filter(item=>wanted.has(normalizeTopic(item.topic)))},
};

// A future WebInterestEnrichmentProvider must return sourced provider facts.
// Only results with a real source and publication metadata may be labeled recent.
