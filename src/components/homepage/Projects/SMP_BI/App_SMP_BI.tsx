import { Toaster } from "./ui_SMP_BI/toaster";
import { Toaster as Sonner } from "./ui_SMP_BI/sonner";
import { TooltipProvider } from "./ui_SMP_BI//tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages_SMP_BI/Index";
import './index_SMP_BI.css'; 

const queryClient = new QueryClient();

const SMPBI = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Index/> 
    </TooltipProvider>
  </QueryClientProvider>
);

export default SMPBI;
