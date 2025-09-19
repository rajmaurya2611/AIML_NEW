// src/apps/knowledge/Root.jsx
import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";
import { Routes, Route } from "react-router-dom";
import { oktaAuthKK } from "./oktaConfigMarcom";
import KKAuthRoute from "./MarcomAuthRoot";

import MarcomMain from "../App_marcom";

const restore = async (_, uri) =>
  window.location.replace(uri || "/knowledgebot");

export default function KnowledgeRoot() {
  return (
    <OktaProvider oktaAuth={oktaAuthKK} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<KKAuthRoute />}>
          <Route index element={<MarcomMain/>} />
        </Route>
      </Routes>
    </OktaProvider>
  );
}
