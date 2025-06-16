import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import UserSlideMenu from './UserSlideMenu';
import ModelSelector from './ModelSelector';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { selectedModel, setSelectedModel } = useChatContext();
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    navigate('/');
  };
  
  return (
    <header className="sticky top-0 z-10 bg-background border-b border-[#dc2626] w-full">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="cursor-pointer" onClick={handleLogoClick}>
            <img 
              src="/favicon.ico"
              alt="Resurrect AI Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-semibold text-foreground hidden sm:block" style={{ fontFamily: 'Segoe UI Semilight, Segoe UI, sans-serif' }}>
            Resurrect AI
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <ModelSelector 
              selectedModel={selectedModel} 
              onModelChange={setSelectedModel}
            />
          </div>
          <UserSlideMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
