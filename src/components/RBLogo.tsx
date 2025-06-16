import React from 'react';
import { useChatContext } from '@/context/ChatContext';

const RBLogo: React.FC = () => {
  const { theme } = useChatContext();
  
  return (
    <div className="flex items-center">
      <div className="flex items-center justify-center">
        <img 
          src="/favicon.ico"
          alt="Resurrect AI Logo"
          className="h-20 w-auto object-contain"
        />
      </div>
    </div>
  );
};

export default RBLogo;
