// src/apps/legallens/Root.tsx
import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";  // ✏️ rename
//                ^^^^^^^^^^^
import { Routes, Route } from "react-router-dom";
import { oktaAuthYachiyo } from "./oktaConfigYachiyo";
         
import App_Yachiyo from "../App_Yachiyo";
import YachiyoAuthRoute from "./YachiyoAuthRoute";

const restore = async (_: any, uri?: string) =>
  window.location.replace(uri || "/yachiyo");

export default function YachiyoRoot() {
  return (
    <OktaProvider oktaAuth={oktaAuthYachiyo} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<YachiyoAuthRoute />}>
                  <Route index element={<App_Yachiyo />} />
        </Route>
      </Routes>
    </OktaProvider>
  );
}
