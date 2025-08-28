import { Toaster } from "./ui_SMP_BI/toaster";
import { Toaster as Sonner } from "./ui_SMP_BI/sonner";
import { TooltipProvider } from "./ui_SMP_BI//tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages_SMP_BI/Index";
import NotFound from "./pages_SMP_BI/NotFound";
import './index_SMP_BI.css'; 

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
