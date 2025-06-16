
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserRound, Settings, LogOut, Moon, Sun, EyeOff, User, ArrowLeft, Bot } from "lucide-react";
import { useChatContext } from '@/context/ChatContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ModelSelector from './ModelSelector';
import { AIModel } from '@/services/aiService';

const UserSlideMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    theme, 
    toggleTheme, 
    incognitoMode, 
    toggleIncognitoMode, 
    selectedModel, 
    setSelectedModel, 
    createNewChat, 
    user,
    signOut
  } = useChatContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleModelChange = (model: AIModel) => {
    setSelectedModel(model);
    createNewChat();
    toast.success(`AI model changed to ${model} - New chat started`);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAccountsClick = () => {
    navigate('/accounts');
    setIsOpen(false);
  };

  const handleBackClick = () => {
    setIsOpen(false);
    if (location.pathname === '/accounts') {
      navigate('/');
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        className="rounded-full"
        onClick={toggleMenu}
        aria-label="User menu"
      >
        <UserRound className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={toggleMenu}
        />
      )}

      {/* Slide Menu */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 bg-background border-l border-[#dc2626] transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={handleBackClick}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">Settings</h2>
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              ×
            </Button>
          </div>

          <div className="space-y-6 flex-1">
            {/* User Info */}
            <div className="text-center pb-4 border-b border-[#dc2626]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <UserRound className="h-8 w-8" />
              </div>
              <h3 className="font-medium">{user?.user_metadata?.full_name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            {/* AI Model Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Bot className="h-5 w-5" />
                <span>AI Model</span>
              </div>
              <ModelSelector 
                selectedModel={selectedModel} 
                onModelChange={handleModelChange}
              />
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span>Theme</span>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </Button>
            </div>

            {/* Incognito Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EyeOff className="h-5 w-5" />
                <span>Incognito Mode</span>
              </div>
              <Switch checked={incognitoMode} onCheckedChange={toggleIncognitoMode} />
            </div>

            {/* Account Settings */}
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={handleAccountsClick}
            >
              <User className="h-4 w-4 mr-3" />
              Account Settings
            </Button>

            {/* Profile Settings */}
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => toast.info("Profile settings would be implemented in a real application")}
            >
              <Settings className="h-4 w-4 mr-3" />
              Profile Settings
            </Button>
          </div>

          {/* Logout */}
          <Button 
            variant="ghost" 
            className="w-full justify-start mt-auto text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
};

export default UserSlideMenu;
