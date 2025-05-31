import { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelRight } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import RightPanelContent from '@/components/RightPanelContent';
import AppSidebar from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { ChatProvider } from '@/contexts/ChatContext';

interface MainLayoutProps {
  defaultFeature?: string;
}

const MainLayout = ({ defaultFeature = 'smart-practice' }: MainLayoutProps) => {
  const { user } = useAuth();
  const [activeFeature, setActiveFeature] = useState(defaultFeature);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <AppSidebar activeFeature={activeFeature} onFeatureSelect={setActiveFeature} />
        
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-full"
          >
            <ResizablePanel 
              defaultSize={40} 
              minSize={30}
              maxSize={isMobile ? 100 : 60}
              className="relative"
              collapsible={!isMobile}
              collapsedSize={0}
              onCollapse={() => setCollapsed(true)}
              onExpand={() => setCollapsed(false)}
            >
              {collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => setCollapsed(false)}
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              )}
              <div className="h-full p-4 overflow-auto">
                <ChatProvider>
                  <ChatInterface />
                </ChatProvider>
              </div>
            </ResizablePanel>
            
            {!isMobile && !collapsed && (
              <ResizableHandle withHandle />
            )}
            
            {(!isMobile || collapsed) && (
              <ResizablePanel defaultSize={60} minSize={30} className="relative">
                {!isMobile && !collapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 z-10"
                    onClick={() => setCollapsed(true)}
                  >
                    <PanelLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="h-full p-4 overflow-auto">
                  <ChatProvider>
                    <RightPanelContent activeFeature={activeFeature} />
                  </ChatProvider>
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;