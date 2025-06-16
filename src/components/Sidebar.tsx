
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useChatContext } from '@/context/ChatContext';
import { cn } from '@/lib/utils';
import { Menu, X, Plus, FileText, Download, Trash2, ArrowLeft, Trash } from 'lucide-react';
import { exportChat } from '@/utils/exportUtils';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import RBLogo from './RBLogo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { chats, currentChat, createNewChat, selectChat, deleteChat, clearAllChats } = useChatContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleExport = () => {
    if (currentChat) {
      exportChat(currentChat);
    }
  };
  
  const confirmDelete = (chatId: string) => {
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
    }
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  const handleClearAll = async () => {
    await clearAllChats();
    setClearAllDialogOpen(false);
  };

  const handleBackClick = () => {
    onToggle();
    navigate('/');
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-[280px] bg-sidebar border-r transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center p-4 border-b border-sidebar-border">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <RBLogo />
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4">
          <Button variant="outline" className="w-full justify-start border-sidebar-border" onClick={createNewChat}>
            <Plus className="mr-2 h-4 w-4" /> 
            New Chat
          </Button>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm">Recent Chats</h3>
              <div className="flex gap-1">
                {currentChat && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={handleExport}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export current chat as text file</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {chats.length > 1 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setClearAllDialogOpen(true)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear all chats</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 px-3 py-2 h-[calc(100vh-150px)]">
          {chats.map((chat) => (
            <div 
              key={chat.id}
              className={cn(
                "flex justify-between items-center py-2 px-3 mb-1 rounded-md cursor-pointer hover:bg-muted group",
                currentChat?.id === chat.id && "bg-muted"
              )}
              onClick={() => selectChat(chat.id)}
            >
              <div className="flex items-center truncate">
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="truncate">
                  <div className="font-medium text-sm truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(chat.updatedAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </ScrollArea>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Chats Confirmation Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Chats</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all your chats? This action cannot be undone and will remove all chat history permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All Chats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Overlay when sidebar is open on mobile - clicking closes the sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;
