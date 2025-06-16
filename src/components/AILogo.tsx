
import React from 'react';

interface AILogoProps {
  src?: string;
  alt?: string;
}

const AILogo: React.FC<AILogoProps> = ({ 
  src = '/placeholder.svg',
  alt = 'AI Assistant Logo' 
}) => {
  return (
    <div className="flex items-center">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
        <img 
          src={src} 
          alt={alt}
          className="h-6 w-6 object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = '/placeholder.svg';
          }}
        />
      </div>
      <span className="ml-2 font-medium text-lg">AI Assistant</span>
    </div>
  );
};

export default AILogo;
