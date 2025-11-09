import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ConnectionBar } from "@/components/ConnectionBar";
import { useROS2 } from "@/hooks/useROS2";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnected, rosUrl, setRosUrl, isConnecting, connect, disconnect } = useROS2();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-10">
            <div className="flex items-center h-16 border-b border-border bg-card px-4">
              <SidebarTrigger />
            </div>
            <ConnectionBar
              isConnected={isConnected}
              rosUrl={rosUrl}
              onUrlChange={setRosUrl}
              onConnect={connect}
              onDisconnect={disconnect}
              isConnecting={isConnecting}
            />
          </div>
          <main className="flex-1 overflow-auto bg-background">
            <Routes>
              <Route path="/" element={<Index isConnected={isConnected} />} />
              <Route path="/admin" element={<div className="p-6 text-center">管理员页面开发中...</div>} />
              <Route path="/fault" element={<div className="p-6 text-center">故障管理页面开发中...</div>} />
              <Route path="/path" element={<div className="p-6 text-center">路径规划页面开发中...</div>} />
              <Route path="/auto" element={<div className="p-6 text-center">全自动施工页面开发中...</div>} />
              <Route path="/remote" element={<div className="p-6 text-center">遥控界面开发中...</div>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
