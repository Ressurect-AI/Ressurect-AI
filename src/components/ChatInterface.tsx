import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle } from 'lucide-react';

const ChatInterface: React.FC = () => {
  const { currentChat, createNewChat } = useChatContext();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          viewport.scrollTo({ 
            top: viewport.scrollHeight, 
            behavior: 'smooth' 
          });
        });
      }
    }
  }, [currentChat?.messages]);

  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to Resurrect AI</h2>
          <p className="text-muted-foreground mb-6">
            Start a conversation with our AI assistant. Choose from multiple models and get intelligent responses.
          </p>
          <Button onClick={createNewChat} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_60%)] animate-fade-in">
      {/* Chat Messages Area - Fixed height with proper scrolling */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea 
          className="h-full w-full"
          ref={scrollAreaRef}
        >
          <div className="max-w-4xl mx-auto p-4 pb-8">
            {currentChat.messages.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Ready to chat</h3>
                  <p className="text-muted-foreground">Send a message to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentChat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            )}
            {/* Scroll anchor to ensure proper scrolling */}
            <div className="h-4" />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input Area - Fixed at bottom */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="max-w-4xl mx-auto">
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
