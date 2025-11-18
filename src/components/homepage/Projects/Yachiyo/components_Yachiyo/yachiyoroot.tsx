// src/apps/legallens/Root.tsx
import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";  // ✏️ rename
//                ^^^^^^^^^^^
import { Routes, Route } from "react-router-dom";
import { oktaAuthYachiyo } from "./oktaConfigYachiyo";
import AuthRoute from "./YachiyoAuthRoute";
         
import App_Yachiyo from "../App_Yachiyo";

import YachiyoDocuments from "./YachiyoDocuments";
 
const restore = async (_: any, uri?: string) =>
  window.location.replace(uri || "/yachiyo");
 
export default function YachiyoRoot() {
  return (
    <OktaProvider oktaAuth={oktaAuthYachiyo} restoreOriginalUri={restore}>
      <Routes>
        <Route path="login/callback" element={<LoginCallback />} />
        <Route element={<AuthRoute />}>
          <Route index element={<App_Yachiyo/>}/>

          <Route path="/documents" element={<YachiyoDocuments />} />

        </Route>
      </Routes>
    </OktaProvider>
  );
}
 