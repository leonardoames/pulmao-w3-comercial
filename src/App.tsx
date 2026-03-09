import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useCurrentUserRole } from "@/hooks/useUserRoles";
import { usePermissionChecks, ROUTE_TO_RESOURCE } from "@/hooks/useRolePermissions";
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
import ChangePassword from "./pages/ChangePassword";
import TrafegoPagoDashboard from "./pages/TrafegoPagoDashboard";
import TrafegoPagoClientes from "./pages/TrafegoPagoClientes";
import MarketplaceDashboard from "./pages/MarketplaceDashboard";
import MarketplaceClientes from "./pages/MarketplaceClientes";
import AdminDashboard from "./pages/AdminDashboard";
import Almoxarifado from "./pages/Almoxarifado";
import Patrimonio from "./pages/Patrimonio";
import PatrimonioAmbientes from "./pages/PatrimonioAmbientes";
import RHColaboradores from "./pages/RHColaboradores";
import RHColaboradorDetail from "./pages/RHColaboradorDetail";
import RHFeedbacks from "./pages/RHFeedbacks";
import RHAvaliacoes from "./pages/RHAvaliacoes";
import RHSetores from "./pages/RHSetores";

const queryClient = new QueryClient();

function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children, routePath }: { children: React.ReactNode; routePath?: string }) {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useCurrentUserRole();
  const { canView, isLoading: permLoading } = usePermissionChecks();

  if (loading || roleLoading || permLoading) {
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

  // Force password change if flagged
  if (user.user_metadata?.must_change_password && routePath !== '/alterar-senha') {
    return <Navigate to="/alterar-senha" replace />;
  }

  // Check route permission if a routePath is provided
  if (routePath) {
    const resourceKey = ROUTE_TO_RESOURCE[routePath];
    if (resourceKey && !canView(resourceKey)) {
      // Redirect to first accessible route
      const firstAccessible = Object.entries(ROUTE_TO_RESOURCE)
        .find(([, key]) => canView(key));
      return <Navigate to={firstAccessible?.[0] || '/auth'} replace />;
    }
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
      <Route path="/alterar-senha" element={<AuthOnlyRoute><ChangePassword /></AuthOnlyRoute>} />
      <Route path="/" element={<ProtectedRoute routePath="/"><Dashboard /></ProtectedRoute>} />
      <Route path="/vendas" element={<ProtectedRoute routePath="/vendas"><Vendas /></ProtectedRoute>} />
      <Route path="/meu-fechamento" element={<ProtectedRoute routePath="/meu-fechamento"><MeuFechamento /></ProtectedRoute>} />
      <Route path="/meta-ote" element={<ProtectedRoute routePath="/meta-ote"><OteTracking /></ProtectedRoute>} />
      <Route path="/social-selling" element={<ProtectedRoute routePath="/social-selling"><SocialSelling /></ProtectedRoute>} />
      <Route path="/tv" element={<ProtectedRoute><TVMode /></ProtectedRoute>} />
      <Route path="/painel-admin" element={<ProtectedRoute routePath="/painel-admin"><UserManagement /></ProtectedRoute>} />
      <Route path="/marketing/dashboard" element={<ProtectedRoute routePath="/marketing/dashboard"><MarketingDashboard /></ProtectedRoute>} />
      {/* Tráfego Pago */}
      <Route path="/trafego-pago/dashboard" element={<ProtectedRoute routePath="/trafego-pago/dashboard"><TrafegoPagoDashboard /></ProtectedRoute>} />
      <Route path="/trafego-pago/clientes" element={<ProtectedRoute routePath="/trafego-pago/clientes"><TrafegoPagoClientes /></ProtectedRoute>} />
      {/* Marketplaces */}
      <Route path="/marketplaces/dashboard" element={<ProtectedRoute routePath="/marketplaces/dashboard"><MarketplaceDashboard /></ProtectedRoute>} />
      <Route path="/marketplaces/clientes" element={<ProtectedRoute routePath="/marketplaces/clientes"><MarketplaceClientes /></ProtectedRoute>} />
      {/* Conteúdo routes */}
      {/* Administrativo */}
      <Route path="/administrativo/dashboard" element={<ProtectedRoute routePath="/administrativo/dashboard"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/administrativo/almoxarifado" element={<ProtectedRoute routePath="/administrativo/almoxarifado"><Almoxarifado /></ProtectedRoute>} />
      <Route path="/administrativo/patrimonio" element={<ProtectedRoute routePath="/administrativo/patrimonio"><Patrimonio /></ProtectedRoute>} />
      <Route path="/administrativo/ambientes" element={<ProtectedRoute routePath="/administrativo/patrimonio"><PatrimonioAmbientes /></ProtectedRoute>} />
      <Route path="/conteudo/dashboard" element={<ProtectedRoute routePath="/conteudo/dashboard"><ConteudoDashboard /></ProtectedRoute>} />
      <Route path="/conteudo/acompanhamento" element={<ProtectedRoute routePath="/conteudo/acompanhamento"><ConteudoAcompanhamento /></ProtectedRoute>} />
      <Route path="/conteudo/controle" element={<ProtectedRoute routePath="/conteudo/controle"><MarketingConteudos /></ProtectedRoute>} />
      <Route path="/conteudo/twitter" element={<ProtectedRoute routePath="/conteudo/twitter"><MarketingTwitter /></ProtectedRoute>} />
      <Route path="/conteudo/ai" element={<ProtectedRoute routePath="/conteudo/ai"><AiAgentsList /></ProtectedRoute>} />
      <Route path="/conteudo/ai/novo" element={<ProtectedRoute routePath="/conteudo/ai"><AiAgentNew /></ProtectedRoute>} />
      <Route path="/conteudo/ai/:id" element={<ProtectedRoute routePath="/conteudo/ai"><AiAgentDetail /></ProtectedRoute>} />
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
    <ThemeProvider defaultTheme="dark" storageKey="pulmao-w3-theme">
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
