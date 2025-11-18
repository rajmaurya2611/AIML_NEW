import { Toaster } from"./components_Yachiyo/ui/toaster";
import { Toaster as Sonner } from "./components_Yachiyo/ui/sonner";
import { TooltipProvider } from "./components_Yachiyo/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages_Yachiyo/Index";
import NotFound from "./pages_Yachiyo/NotFound";

//import {  Security as OktaProvider, LoginCallback } from "@okta/okta-react";
//import { oktaAuthYachiyo } from "./components_Yachiyo/oktaConfigYachiyo"
//import AuthRoute from "./components_Yachiyo/YachiyoAuthRoute";
import YachiyoDocuments from "./components_Yachiyo/YachiyoDocuments"
import YachiyoLayout from "./components_Yachiyo/YachiyoLayout"
import { YachiyoProvider } from "./components_Yachiyo/context/YachiyoContext"

const queryClient = new QueryClient();

// const restoreOriginalUri = async (_oktaAuth: any, originalUri?: string) => {
//   // replace the current location with the originalUri (or yachiyo root)
//   window.location.replace(originalUri || "/yachiyo");
// };

// const restore = async (_: any, uri?: string) =>
//   window.location.replace(uri || "/yachiyo");



const App_Yachiyo = () => (
  <YachiyoProvider>
  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* <OktaProvider oktaAuth={oktaAuthYachiyo} restoreOriginalUri={restoreOriginalUri}> */}
        <Routes>
           {/* <Route path="login/callback" element={<LoginCallback />} />
           <Route element={<AuthRoute />}> */}

          <Route element={<YachiyoLayout />}>

          <Route index element={<Index />} />
          <Route path="/documents" element={<YachiyoDocuments />} />
         
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Route>
           {/* </Route> */}
        </Routes>
  {/* </OktaProvider> */}
    </TooltipProvider>
  </QueryClientProvider>
  </YachiyoProvider>
);

export default App_Yachiyo;
