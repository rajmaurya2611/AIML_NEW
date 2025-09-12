// src/apps/legallens/Root.tsx
import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";  // ✏️ rename
//                ^^^^^^^^^^^
import { Routes, Route } from "react-router-dom";
import { oktaAuthLegal } from "./oktaConfigLegalLens";
import AuthRoute from "./legalAuthRoute";

import Home          from "./legalMain";
import AnalysisPage  from "./analysis";
import ComparisonPage from "./comparison";
import RiskAnalysisPage from "./risk_analysis"
import ClauseCheckPage from "./clause_check"

const restore = async (_: any, uri?: string) =>
  window.location.replace(uri || "/legallens");

export default function LegalLensRoot() {
  return (
    <OktaProvider oktaAuth={oktaAuthLegal} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<AuthRoute />}>
          <Route index element={<Home />} />
          <Route path="analysis"   element={<AnalysisPage />} />
          <Route path="comparison" element={<ComparisonPage />} />
          <Route path="risk_analysis" element={<RiskAnalysisPage />} />
          <Route path="clause_check" element={<ClauseCheckPage />} />
        </Route>
      </Routes>
    </OktaProvider>
  );
}
