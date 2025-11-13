import { Toaster } from "./components_Yachiyo/ui/toaster";
import { Toaster as Sonner } from "./components_Yachiyo/ui/sonner";
import { TooltipProvider } from "./components_Yachiyo/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

import Index from "./pages_Yachiyo/Index";
import NotFound from "./pages_Yachiyo/NotFound";
import YachiyoDocuments from "./components_Yachiyo/YachiyoDocuments";
import YachiyoLayout from "./components_Yachiyo/YachiyoLayout";
import { YachiyoProvider } from "./components_Yachiyo/context/YachiyoContext";

const queryClient = new QueryClient();

const App_Yachiyo = () => (
  <YachiyoProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          <Route element={<YachiyoLayout />}>
            <Route index element={<Index />} />
            <Route path="documents" element={<YachiyoDocuments />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  </YachiyoProvider>
);

export default App_Yachiyo;
