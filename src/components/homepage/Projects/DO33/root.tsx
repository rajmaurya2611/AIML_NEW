// // src/apps/do33/Root.tsx
// import { Security as OktaProvider, LoginCallback } from "@okta/okta-react";
// import { Routes, Route } from "react-router-dom";
// import { oktaAuthDO33 } from "./oktaConfigDO33";
// import DDAuthRoute from "./do33AuthRoute";

// import DO33Main from "./do33_main";   // your main component

// const restore = async (_: any, uri?: string) =>
//   window.location.replace(uri || "/do33");

// export default function DO33Root() {
//   return (
//     <OktaProvider oktaAuth={oktaAuthDO33} restoreOriginalUri={restore}>
//       <Routes>
//         <Route path="login/callback" element={<LoginCallback />} />
//         <Route element={<DDAuthRoute />}>
//           <Route index element={<DO33Main />} />
//           {/* add more DO-33 sub-routes here if needed */}
//         </Route>
//       </Routes>
//     </OktaProvider>
//   );
// }


// src/apps/do33/Root.tsx (removed OKTA for launch just uncomment above to reaplly OKTA)
import { Routes, Route } from "react-router-dom";
import DO33Main from "./do33_main";

export default function DO33Root() {
  return (
    <Routes>
      <Route index element={<DO33Main />} />
      {/* add more DO-33 sub-routes here if needed */}
    </Routes>
  );
}
