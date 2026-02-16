import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useIsSocialSelling, useCurrentUserRole } from "@/hooks/useUserRoles";
import { ThemeProvider } from "@/components/theme-provider";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Vendas from "./pages/Vendas";
import MeuFechamento from "./pages/MeuFechamento";
import TVMode from "./pages/TVMode";
import UserManagement from "./pages/UserManagement";
import OteTracking from "./pages/OteTracking";
import SocialSelling from "./pages/SocialSelling";
import MarketingDashboard from "./pages/MarketingDashboard";
import MarketingConteudos from "./pages/MarketingConteudos";
import MarketingTwitter from "./pages/MarketingTwitter";
import AiAgentsList from "./pages/AiAgentsList";
import AiAgentNew from "./pages/AiAgentNew";
import AiAgentDetail from "./pages/AiAgentDetail";
import ConteudoDashboard from "./pages/ConteudoDashboard";
import ConteudoAcompanhamento from "./pages/ConteudoAcompanhamento";
import NotFound from "./pages/NotFound";
import SharedDashboard from "./pages/SharedDashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowSocialSelling }: { children: React.ReactNode; allowSocialSelling?: boolean }) {
  const { user, loading } = useAuth();
  const isSocialSelling = useIsSocialSelling();
  const { data: userRole, isLoading: roleLoading } = useCurrentUserRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Social Selling users can only access /social-selling
  if (isSocialSelling && !allowSocialSelling) {
    return <Navigate to="/social-selling" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
      <Route path="/meu-fechamento" element={<ProtectedRoute><MeuFechamento /></ProtectedRoute>} />
      <Route path="/meta-ote" element={<ProtectedRoute><OteTracking /></ProtectedRoute>} />
      <Route path="/social-selling" element={<ProtectedRoute allowSocialSelling><SocialSelling /></ProtectedRoute>} />
      <Route path="/tv" element={<ProtectedRoute><TVMode /></ProtectedRoute>} />
      <Route path="/painel-admin" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/marketing/dashboard" element={<ProtectedRoute><MarketingDashboard /></ProtectedRoute>} />
      {/* Conteúdo routes */}
      <Route path="/conteudo/dashboard" element={<ProtectedRoute><ConteudoDashboard /></ProtectedRoute>} />
      <Route path="/conteudo/acompanhamento" element={<ProtectedRoute><ConteudoAcompanhamento /></ProtectedRoute>} />
      <Route path="/conteudo/controle" element={<ProtectedRoute><MarketingConteudos /></ProtectedRoute>} />
      <Route path="/conteudo/twitter" element={<ProtectedRoute><MarketingTwitter /></ProtectedRoute>} />
      <Route path="/conteudo/ai" element={<ProtectedRoute><AiAgentsList /></ProtectedRoute>} />
      <Route path="/conteudo/ai/novo" element={<ProtectedRoute><AiAgentNew /></ProtectedRoute>} />
      <Route path="/conteudo/ai/:id" element={<ProtectedRoute><AiAgentDetail /></ProtectedRoute>} />
      {/* Legacy redirects */}
      <Route path="/marketing/conteudos" element={<Navigate to="/conteudo/controle" replace />} />
      <Route path="/marketing/twitter" element={<Navigate to="/conteudo/twitter" replace />} />
      <Route path="/marketing/ai" element={<Navigate to="/conteudo/ai" replace />} />
      <Route path="/marketing/ai/novo" element={<Navigate to="/conteudo/ai/novo" replace />} />
      <Route path="/marketing/ai/:id" element={<Navigate to="/conteudo/ai" replace />} />
      <Route path="/shared/:token" element={<SharedDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="pulmao-w3-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
