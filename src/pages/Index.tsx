
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useChatContext } from '@/context/ChatContext';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useChatContext();
  const navigate = useNavigate();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show auth page if not authenticated
  useEffect(() => {
    if (user === null) {
      // Only redirect if we're sure there's no user (not just loading)
      const timer = setTimeout(() => {
        if (user === null) {
          navigate('/auth');
        }
      }, 1000); // Give time for auth state to load
      
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  // Show loading or auth redirect
  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          
          <div className="flex flex-col flex-1 relative">
            {/* Menu toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-4 top-4 z-10 bg-background/80 backdrop-blur-sm border shadow-sm",
                sidebarOpen && "hidden md:flex"
              )}
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <ChatInterface />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
