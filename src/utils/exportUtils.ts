
import { Chat } from '@/types';
import { toast } from "sonner";

export const downloadAsTextFile = (content: string, fileName: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatChatToText = (chat: Chat): string => {
  let output = `Chat: ${chat.title}\n`;
  output += `Date: ${formatDate(chat.createdAt)}\n\n`;
  
  chat.messages.forEach(message => {
    output += `${message.role.toUpperCase()} [${formatDate(message.timestamp)}]:\n${message.content}\n\n`;
  });
  
  return output;
};

export const exportChat = async (chat: Chat) => {
  try {
    const fileName = `${chat.title.replace(/[^\w\s]/gi, '')}_${new Date().toISOString().split('T')[0]}.txt`;
    const textContent = formatChatToText(chat);
    
    downloadAsTextFile(textContent, fileName);
    toast.success('Chat exported as text file');
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Export failed. Please try again.');
  }
};
