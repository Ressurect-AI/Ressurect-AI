
import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import ChatMessage from './ChatMessage';
import { ScrollArea } from "@/components/ui/scroll-area";

const ChatContainer: React.FC = () => {
  const { currentChat } = useChatContext();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [currentChat?.messages]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center animate-fade-in">
          <div className="text-lg sm:text-2xl text-muted-foreground mb-4">
            Welcome back, <span className="text-red-600">User</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea 
      className="flex-1 h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] p-4 sm:p-6 touch-pan-y" 
      ref={scrollAreaRef}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {currentChat.messages.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-300px)]">
            <div className="text-center animate-fade-in">
              <div className="text-lg sm:text-2xl text-muted-foreground">
                Welcome back, <span className="text-red-600">User</span>
              </div>
            </div>
          </div>
        ) : (
          currentChat.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatContainer;
