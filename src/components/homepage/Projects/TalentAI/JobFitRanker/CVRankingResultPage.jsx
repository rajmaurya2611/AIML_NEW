// src/pages/JobFitRanker/CvRankingResultPage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CVRankingResult from "./CVRankingResult";

export default function CvRankingResultPage() {
  const [skills, setSkills] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const location = useLocation();

  useEffect(() => {
    // Try to get dataKey from URL query params (preferred)
    const params = new URLSearchParams(location.search);
    const dataKey = params.get("dataKey");

    if (dataKey) {
      const stored = sessionStorage.getItem(dataKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSkills(parsed.skills || []);
          setCandidates(parsed.candidates || []);
        } catch (e) {
          console.error("Failed to parse CV ranking data");
          setSkills([]);
          setCandidates([]);
        }
      }
    }
    // Also fallback to location.state if present (rare)
    else if (location.state) {
      setSkills(location.state.skills || []);
      setCandidates(location.state.candidates || []);
    }
  }, [location]);

  return <CVRankingResult skills={skills} candidates={candidates} />;
}
