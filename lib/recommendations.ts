import type { Recommendation, RecommendationCategory, RecommendationUserState } from "./types";

export function mergeRecommendationUserState(recommendations:Recommendation[],userState:RecommendationUserState):Recommendation[]{
  return recommendations.map(recommendation=>({...recommendation,...userState[recommendation.id]}));
}

export function countOpenRecommendations(recommendations:Recommendation[],category?:RecommendationCategory):number{
  return recommendations.filter(recommendation=>!recommendation.completed&&!recommendation.dismissed&&(!category||recommendation.category===category)).length;
}
