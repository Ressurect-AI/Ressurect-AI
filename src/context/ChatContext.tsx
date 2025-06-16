import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message, ThemeMode } from '@/types';
import { toast } from 'sonner';
import { generateAIResponse, AIModel } from '@/services/aiService';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface ChatContextProps {
  chats: Chat[];
  currentChat: Chat | null;
  incognitoMode: boolean;
  theme: ThemeMode;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleIncognitoMode: () => void;
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, files?: File[]) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => Promise<void>;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  syncChatsFromDB: () => Promise<void>;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

const initialMessage: Message = {
  id: uuidv4(),
  role: 'assistant',
  content: "Hello! I'm your AI assistant. How can I help you today?",
  timestamp: new Date(),
};

const createInitialChat = (): Chat => ({
  id: uuidv4(),
  title: "New Chat",
  messages: [initialMessage],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [incognitoChats, setIncognitoChats] = useState<Chat[]>([]);
  const [regularChats, setRegularChats] = useState<Chat[]>([]);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-2.0-flash');

  // Initialize auth state
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setAuthLoading(false);
        
        // When user logs in, sync chats from database
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, syncing chats...');
          // Use timeout to ensure state is properly set
          setTimeout(() => {
            syncChatsFromDB();
          }, 500);
        }
        
        // When user logs out, clear incognito chats and reset to local storage
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing chats and loading local chats...');
          setIncognitoChats([]);
          setIncognitoMode(false);
          loadLocalChats();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Checking existing session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      
      if (session?.user) {
        console.log('Found existing session, syncing chats...');
        setTimeout(() => {
          syncChatsFromDB();
        }, 500);
      } else {
        console.log('No existing session, loading local chats...');
        loadLocalChats();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clear incognito chats when page is refreshed or navigated away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (incognitoMode) {
        setIncognitoChats([]);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && incognitoMode) {
        // Clear incognito chats when user switches tabs/windows
        setIncognitoChats([]);
        if (regularChats.length > 0) {
          setChats(regularChats);
          setCurrentChat(regularChats[0]);
        } else {
          const newChat = createInitialChat();
          setChats([newChat]);
          setCurrentChat(newChat);
        }
        setIncognitoMode(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [incognitoMode, regularChats]);

  // Load chats from localStorage when not authenticated
  const loadLocalChats = () => {
    console.log('Loading chats from localStorage...');
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        const processedChats = parsedChats.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        console.log('Loaded', processedChats.length, 'chats from localStorage');
        setChats(processedChats);
        setRegularChats(processedChats);
        setCurrentChat(processedChats[0] || createInitialChat());
      } catch (error) {
        console.error('Error parsing local chats:', error);
        const newChat = createInitialChat();
        setChats([newChat]);
        setRegularChats([newChat]);
        setCurrentChat(newChat);
      }
    } else {
      console.log('No chats in localStorage, creating initial chat');
      const newChat = createInitialChat();
      setChats([newChat]);
      setRegularChats([newChat]);
      setCurrentChat(newChat);
    }
  };

  // Save chat to database function
  const saveChatToDB = async (chat: Chat) => {
    if (!user || incognitoMode) {
      return;
    }

    try {
      console.log('Saving chat to database:', chat.id);
      
      // First, upsert the chat
      const { error: chatError } = await supabase
        .from('chats')
        .upsert({
          id: chat.id,
          user_id: user.id,
          title: chat.title,
          created_at: chat.createdAt.toISOString(),
          updated_at: chat.updatedAt.toISOString(),
        });

      if (chatError) {
        console.error('Error saving chat:', chatError);
        return;
      }

      // Then, save all messages
      for (const message of chat.messages) {
        const { error: messageError } = await supabase
          .from('messages')
          .upsert({
            id: message.id,
            chat_id: chat.id,
            role: message.role,
            content: message.content,
            created_at: message.timestamp.toISOString(),
          });

        if (messageError) {
          console.error('Error saving message:', messageError);
        }
      }

      console.log('Successfully saved chat to database');
    } catch (error) {
      console.error('Error in saveChatToDB:', error);
    }
  };

  // Sync chats from database when authenticated
  const syncChatsFromDB = async () => {
    if (!user) {
      console.log('No user available for chat sync');
      return;
    }

    try {
      console.log('Syncing chats from database for user:', user.id);
      
      // Fetch chats from database
      const { data: dbChats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          messages (
            id,
            role,
            content,
            model,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (chatsError) {
        console.error('Error fetching chats from database:', chatsError);
        toast.error('Failed to load chat history');
        const newChat = createInitialChat();
        setChats([newChat]);
        setRegularChats([newChat]);
        setCurrentChat(newChat);
        return;
      }

      console.log('Successfully fetched chats from database:', dbChats?.length || 0);

      if (dbChats && dbChats.length > 0) {
        // Convert database chats to local format
        const convertedChats: Chat[] = dbChats.map((dbChat: any) => ({
          id: dbChat.id,
          title: dbChat.title,
          createdAt: new Date(dbChat.created_at),
          updatedAt: new Date(dbChat.updated_at),
          messages: dbChat.messages
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
            }))
        }));

        setChats(convertedChats);
        setRegularChats(convertedChats);
        setCurrentChat(convertedChats[0]);
        console.log('Successfully synced', convertedChats.length, 'chats from database');
        toast.success(`Restored ${convertedChats.length} chat${convertedChats.length === 1 ? '' : 's'} from your history`);
      } else {
        // No chats in database, create initial chat
        console.log('No chats found in database, creating initial chat');
        const newChat = createInitialChat();
        setChats([newChat]);
        setRegularChats([newChat]);
        setCurrentChat(newChat);
      }
    } catch (error) {
      console.error('Error syncing chats from database:', error);
      toast.error('Failed to sync chat history');
      const newChat = createInitialChat();
      setChats([newChat]);
      setRegularChats([newChat]);
      setCurrentChat(newChat);
    }
  };

  // Clear all chats function
  const clearAllChats = async () => {
    try {
      if (user && !incognitoMode) {
        // Delete all chats from database
        const { error } = await supabase
          .from('chats')
          .delete()
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error clearing chats from database:', error);
          toast.error('Failed to clear all chats');
          return;
        }
        
        console.log('Successfully cleared all chats from database');
      } else if (!user) {
        // Clear from localStorage
        localStorage.removeItem('chats');
        console.log('Cleared chats from localStorage');
      }
      
      // Reset local state
      const newChat = createInitialChat();
      setChats([newChat]);
      setRegularChats([newChat]);
      setCurrentChat(newChat);
      
      if (incognitoMode) {
        setIncognitoChats([newChat]);
      }
      
      toast.success('All chats cleared successfully');
    } catch (error) {
      console.error('Error clearing all chats:', error);
      toast.error('Failed to clear all chats');
    }
  };

  useEffect(() => {
    if (!user && !incognitoMode && chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats, user, incognitoMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleIncognitoMode = () => {
    const newMode = !incognitoMode;
    setIncognitoMode(newMode);
    
    if (newMode) {
      // Entering incognito mode - save current chats and create fresh chat
      setRegularChats(chats);
      const newChat = createInitialChat();
      setIncognitoChats([newChat]);
      setChats([newChat]);
      setCurrentChat(newChat);
      toast.info('Incognito mode enabled - chats will be cleared when you switch tabs or sign out');
    } else {
      // Exiting incognito mode - restore previous chats and clear incognito
      setIncognitoChats([]);
      if (regularChats.length > 0) {
        setChats(regularChats);
        setCurrentChat(regularChats[0]);
        toast.info('Incognito mode disabled - chat history restored');
      } else {
        // If no saved chats, sync from database or load local
        if (user) {
          syncChatsFromDB();
        } else {
          loadLocalChats();
        }
      }
    }
  };

  const createNewChat = () => {
    const newChat = createInitialChat();
    
    if (incognitoMode) {
      setIncognitoChats([newChat, ...incognitoChats]);
      setChats([newChat, ...incognitoChats]);
    } else {
      const updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setRegularChats(updatedChats);
    }
    setCurrentChat(newChat);
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const sendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    
    console.log('=== CHAT CONTEXT: Starting message send ===');
    console.log('Selected model:', selectedModel);
    console.log('Message content:', content);
    console.log('Files:', files?.length || 0);
    
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    if (currentChat) {
      const chatWithUserMessage = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
        updatedAt: new Date(),
      };
      
      if (currentChat.messages.length === 1) {
        chatWithUserMessage.title = content.length > 30 ? `${content.substring(0, 30)}...` : content;
      }
      
      setCurrentChat(chatWithUserMessage);
      
      // Update appropriate chat arrays
      if (incognitoMode) {
        const updatedIncognitoChats = incognitoChats.map(chat => 
          chat.id === currentChat.id ? chatWithUserMessage : chat
        );
        setIncognitoChats(updatedIncognitoChats);
        setChats(updatedIncognitoChats);
      } else {
        const updatedChats = chats.map(chat => 
          chat.id === currentChat.id ? chatWithUserMessage : chat
        );
        setChats(updatedChats);
        setRegularChats(updatedChats);
      }
      
      try {
        console.log('=== CHAT CONTEXT: Generating AI response ===');
        console.log('Using model:', selectedModel);
        
        const aiResponseContent = await generateAIResponse(content, selectedModel, files);
        
        console.log('=== CHAT CONTEXT: AI response received ===');
        console.log('Response content:', aiResponseContent);
        
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: aiResponseContent,
          timestamp: new Date(),
        };
        
        const finalChat = {
          ...chatWithUserMessage,
          messages: [...chatWithUserMessage.messages, aiMessage],
          updatedAt: new Date(),
        };
        
        setCurrentChat(finalChat);
        
        // Update appropriate chat arrays
        if (incognitoMode) {
          const updatedIncognitoChats = incognitoChats.map(chat => 
            chat.id === currentChat.id ? finalChat : chat
          );
          setIncognitoChats(updatedIncognitoChats);
          setChats(updatedIncognitoChats);
        } else {
          const updatedChats = chats.map(chat => 
            chat.id === currentChat.id ? finalChat : chat
          );
          setChats(updatedChats);
          setRegularChats(updatedChats);
          
          // Save to database if authenticated
          if (user) {
            await saveChatToDB(finalChat);
          }
        }
      } catch (error) {
        console.error('=== CHAT CONTEXT: Error generating AI response ===', error);
        
        let errorMessage = 'Sorry, I encountered an error while generating a response. Please try again.';
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage = 'API key not found. Please check your API configuration.';
          } else if (error.message.includes('API Error')) {
            errorMessage = `API Error: ${error.message}`;
          }
        }
        
        const errorMessageObj: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
        };
        
        const errorChat = {
          ...chatWithUserMessage,
          messages: [...chatWithUserMessage.messages, errorMessageObj],
          updatedAt: new Date(),
        };
        
        setCurrentChat(errorChat);
        
        // Update appropriate chat arrays
        if (incognitoMode) {
          const updatedIncognitoChats = incognitoChats.map(chat => 
            chat.id === currentChat.id ? errorChat : chat
          );
          setIncognitoChats(updatedIncognitoChats);
          setChats(updatedIncognitoChats);
        } else {
          const updatedChats = chats.map(chat => 
            chat.id === currentChat.id ? errorChat : chat
          );
          setChats(updatedChats);
          setRegularChats(updatedChats);
        }
        
        toast.error(errorMessage);
      }
    }
  };

  const deleteChat = (chatId: string) => {
    if (incognitoMode) {
      const updatedIncognitoChats = incognitoChats.filter(chat => chat.id !== chatId);
      setIncognitoChats(updatedIncognitoChats);
      setChats(updatedIncognitoChats);
      
      if (currentChat?.id === chatId) {
        if (updatedIncognitoChats.length > 0) {
          setCurrentChat(updatedIncognitoChats[0]);
        } else {
          const newChat = createInitialChat();
          setIncognitoChats([newChat]);
          setChats([newChat]);
          setCurrentChat(newChat);
        }
      }
    } else {
      const updatedChats = chats.filter(chat => chat.id !== chatId);
      setChats(updatedChats);
      setRegularChats(updatedChats);
      
      if (currentChat?.id === chatId) {
        if (updatedChats.length > 0) {
          setCurrentChat(updatedChats[0]);
        } else {
          const newChat = createInitialChat();
          setChats([newChat]);
          setRegularChats([newChat]);
          setCurrentChat(newChat);
        }
      }
      
      // Delete from database if authenticated
      if (user) {
        supabase.from('chats').delete().eq('id', chatId);
      }
    }
    
    toast.success("Chat deleted");
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Error signing out');
      } else {
        toast.success('Signed out successfully');
        // Clear incognito chats and reset to initial state
        setIncognitoChats([]);
        setIncognitoMode(false);
        const newChat = createInitialChat();
        setChats([newChat]);
        setRegularChats([newChat]);
        setCurrentChat(newChat);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
    }
  };

  // Add the missing addMessage function
  const addMessage = async (role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
    };
    
    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, message],
        updatedAt: new Date(),
      };
      
      setCurrentChat(updatedChat);
      
      // Update appropriate chat arrays
      if (incognitoMode) {
        const updatedIncognitoChats = incognitoChats.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        );
        setIncognitoChats(updatedIncognitoChats);
        setChats(updatedIncognitoChats);
      } else {
        const updatedChats = chats.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        );
        setChats(updatedChats);
        setRegularChats(updatedChats);
        
        // Save to database if authenticated
        if (user) {
          await saveChatToDB(updatedChat);
        }
      }
    }
  };

  // Don't render until auth is loaded
  if (authLoading) {
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
    <ChatContext.Provider value={{
      chats,
      currentChat,
      incognitoMode,
      theme,
      selectedModel,
      setSelectedModel,
      setTheme,
      toggleTheme,
      toggleIncognitoMode,
      createNewChat,
      selectChat,
      sendMessage,
      addMessage,
      deleteChat,
      clearAllChats,
      user,
      session,
      signOut,
      syncChatsFromDB,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
