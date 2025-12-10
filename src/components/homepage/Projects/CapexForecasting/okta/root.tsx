import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";
import { Routes, Route } from "react-router-dom";
import { oktaAuthCapex } from "./oktaConfigCapex";
import AuthRoute from "./capexAuthRoute";
import CapexApp from "../CapexApp"
import DataViewerPage from "../pages_Capex/DataViewerPage";
import SiteRegionViewer from "../pages_Capex/SiteRegionViewer";
import CommodityTranslationViewer from "../pages_Capex/CommodityTranslationViewer";

const restore = async (_: any, uri?: string) => {
  window.location.replace(uri || "/capex-forecasting");
};

export default function CapexRoot() {
  return (
    <OktaProvider oktaAuth={oktaAuthCapex} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<AuthRoute />}>
          <Route index element={<CapexApp />} />
          <Route path="data-viewer" element={<DataViewerPage />} />
          <Route path="site-region-viewer" element={<SiteRegionViewer />} />
          <Route path="commodity-translation" element={<CommodityTranslationViewer />} />
        </Route>
      </Routes>
    </OktaProvider>
  );
}
