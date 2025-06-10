// src/apps/legallens/Root.tsx
import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";  // ✏️ rename
//                ^^^^^^^^^^^
import { Routes, Route } from "react-router-dom";
import { oktaAuthLegal } from "./oktaConfigLegalLens";
import AuthRoute from "./legalAuthRoute";

import Home          from "./legalMain";
import AnalysisPage  from "./analysis";
import ComparisonPage from "./comparison";

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
        </Route>
      </Routes>
    </OktaProvider>
  );
}
