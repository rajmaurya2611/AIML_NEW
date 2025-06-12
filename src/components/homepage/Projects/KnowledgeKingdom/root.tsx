// src/apps/knowledge/Root.tsx
import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";
import { Routes, Route } from "react-router-dom";
import { oktaAuthKK } from "./oktaConfigKnowledgeKingdom";
import KKAuthRoute from "./KnowledgeAuthRoute";

import KnowledgeMain from "./KnowledgeKingdom_main";

const restore = async (_: any, uri?: string) =>
  window.location.replace(uri || "/knowledgebot");

export default function KnowledgeRoot() {
  return (
    <OktaProvider oktaAuth={oktaAuthKK} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<KKAuthRoute />}>
          <Route index element={<KnowledgeMain />} />
        </Route>
      </Routes>
    </OktaProvider>
  );
}
