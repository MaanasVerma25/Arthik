import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import StockSimulatorPage from "./pages/StockSimulatorPage";
import ForexSimulatorPage from "./pages/ForexSimulatorPage";
import ProfilePage from "./pages/ProfilePage";
import AiBudgetingPage from "./pages/AiBudgetingPage";
import CryptoPage from "./pages/CryptoPage";
import NewsPage from "./pages/NewsPage";
import AboutUsPage from "./pages/AboutUsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/games/stock-simulator" element={<StockSimulatorPage />} />
          <Route path="/games/forex-simulator" element={<ForexSimulatorPage />} />
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/budgeting" element={<AiBudgetingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
