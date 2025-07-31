// src/pages/JobFitRanker/openRankingTab.js
export function openCVRankingResultTab({ skills, candidates }) {
  // Generate unique key for sessionStorage to avoid collisions
  const dataKey = `cv-ranking-result-${Date.now()}`;

  // Store data as JSON string
  sessionStorage.setItem(dataKey, JSON.stringify({ skills, candidates }));

  // Open new tab with route that will read dataKey from URL
  window.open(`/talentai/cv-ranking-result?dataKey=${dataKey}`, "_blank");
}
