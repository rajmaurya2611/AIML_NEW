import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";
import { Routes, Route } from "react-router-dom";
import { oktaAuthCapex } from "./oktaConfigCapex"; // <- make sure this file exists in same folder
import AuthRoute from "./capexAuthRoute";
import CapexApp from "../CapexApp"
import DataViewerPage from "../pages_Capex/DataViewerPage";

// Keep restore ONLY here (not in OktaAuth config)
const restore = async (_: any, uri?: string) => {
  window.location.replace(uri || "/capex-forecasting");
};

export default function CapexRoot() {
  // Debug: prove only provider has restore
  // eslint-disable-next-line no-console
  console.log("restore in oktaAuthCapex.options:", typeof (oktaAuthCapex as any)?.options?.restoreOriginalUri);

  return (
    <OktaProvider oktaAuth={oktaAuthCapex} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<AuthRoute />}>
          <Route index element={<CapexApp />} />
          {/* 🔒 everything below is behind Okta */}
        <Route element={<AuthRoute />}>
          <Route index element={<CapexApp />} />
          <Route path="data-viewer" element={<DataViewerPage />} />  {/* ⬅️ here */}
        </Route>
        </Route>
      </Routes>
    </OktaProvider>
  );
}
