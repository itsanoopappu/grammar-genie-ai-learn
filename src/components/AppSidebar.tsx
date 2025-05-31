import { useState } from 'react';
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarFooter,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Target, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  MessageCircle, 
  User, 
  LogOut, 
  Settings 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface AppSidebarProps {
  activeFeature: string;
  onFeatureSelect: (feature: string) => void;
}

const AppSidebar = ({ activeFeature, onFeatureSelect }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { state } = useSidebar();
  
  if (!user) return null;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            {state === "expanded" && (
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GrammarAI
              </div>
            )}
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuButton 
            isActive={activeFeature === 'chat'} 
            onClick={() => onFeatureSelect('chat')}
            tooltip="Chat with AI Tutor"
          >
            <MessageCircle className="h-5 w-5" />
            <span>AI Tutor</span>
          </SidebarMenuButton>
          
          <SidebarMenuButton 
            isActive={activeFeature === 'smart-practice'} 
            onClick={() => onFeatureSelect('smart-practice')}
            tooltip="Smart Practice"
          >
            <Target className="h-5 w-5" />
            <span>Smart Practice</span>
          </SidebarMenuButton>
          
          <SidebarMenuButton 
            isActive={activeFeature === 'grammar-topics'} 
            onClick={() => onFeatureSelect('grammar-topics')}
            tooltip="Grammar Topics"
          >
            <BookOpen className="h-5 w-5" />
            <span>Grammar Topics</span>
          </SidebarMenuButton>
          
          <SidebarMenuButton 
            isActive={activeFeature === 'assessment'} 
            onClick={() => onFeatureSelect('assessment')}
            tooltip="Assessment"
          >
            <CheckCircle className="h-5 w-5" />
            <span>Assessment</span>
          </SidebarMenuButton>
          
          <SidebarMenuButton 
            isActive={activeFeature === 'progress'} 
            onClick={() => onFeatureSelect('progress')}
            tooltip="My Progress"
          >
            <TrendingUp className="h-5 w-5" />
            <span>My Progress</span>
          </SidebarMenuButton>
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="p-2">
          {state === "expanded" ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={profile?.username || 'User'} />
                  <AvatarFallback>{(profile?.username || 'U')[0]}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{profile?.username || user.email}</div>
                  <div className="text-xs text-muted-foreground">Level {profile?.level || 'A1'}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={profile?.username || 'User'} />
                <AvatarFallback>{(profile?.username || 'U')[0]}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;