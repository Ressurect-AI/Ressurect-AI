import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Mic, Send, Square, X, FileImage, FileText, ImageIcon } from 'lucide-react';
import { useChatContext } from '@/context/ChatContext';
import { generateGeminiImageResponse } from '@/services/aiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, selectedModel, addMessage } = useChatContext();

  const placeholders = [
    "Ask me anything...",
    "What's on your mind?", 
    "How can I help you today?",
    "Start typing your message...",
    "Upload files or generate images..."
  ];

  useEffect(() => {
    const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    setPlaceholder(randomPlaceholder);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFiles.length > 0) && !isLoading) {
      setIsLoading(true);
      try {
        await sendMessage(message, selectedFiles);
        setMessage('');
        setSelectedFiles([]);
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Check if model supports file uploads
      const geminiModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-preview-05-20'];
      
      if (!geminiModels.includes(selectedModel)) {
        toast.error('File uploads are only supported with Gemini models');
        return;
      }
      
      setSelectedFiles(prev => [...prev, ...files]);
      toast.success(`${files.length} file(s) selected`);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      toast.info("Voice recording feature coming soon!");
      setTimeout(() => {
        setIsRecording(false);
      }, 3000);
    } else {
      toast.info("Voice recording stopped");
    }
  };

  // Updated function to handle Gemini image generation with correct model
  const handleImageGeneration = async () => {
    if (!message.trim()) {
      toast.error('Please enter a prompt for image generation');
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== GENERATING IMAGE WITH GEMINI 2.0 FLASH ===');
      console.log('Prompt:', message);
      
      // Add user message first
      await addMessage('user', message);
      
      // Generate image with Gemini 2.0 Flash using the fixed implementation
      const imageResponse = await generateGeminiImageResponse(message);
      
      // Add AI response with the generated image
      await addMessage('assistant', imageResponse);
      
      setMessage('');
      toast.success('Image generated successfully with Gemini 2.0 Flash!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current model supports image generation
  const supportsImageGeneration = selectedModel === 'gemini-2.0-flash';

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
              {getFileIcon(file)}
              <span className="truncate max-w-32">{file.name}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-4 w-4 p-0"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end bg-background/60 backdrop-blur-md border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary/60 focus-within:border-transparent">
        <div className="flex items-center pl-4 py-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            onClick={handleFileUpload}
            className="h-8 w-8 hover:bg-muted rounded-lg"
            title="Attach file (Gemini models only)"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "flex-1 min-h-[44px] max-h-[120px] bg-transparent border-0 focus:outline-none focus:ring-0 resize-none py-3 px-2 text-sm placeholder:text-muted-foreground",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          rows={1}
        />
        
        <div className="flex items-center pr-2 py-3 gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            onClick={handleMicClick}
            className={cn(
              "h-8 w-8 rounded-lg transition-colors",
              isRecording ? "bg-red-100 text-red-600 animate-pulse" : "hover:bg-muted text-muted-foreground"
            )}
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </Button>

          {/* Image Generation Button - Only show for Gemini 2.0 Flash */}
          {supportsImageGeneration && (
            <Button 
              type="button" 
              size="icon" 
              variant="ghost"
              onClick={handleImageGeneration}
              disabled={!message.trim() || isLoading}
              className={cn(
                "h-8 w-8 rounded-lg transition-colors",
                message.trim() && !isLoading
                  ? "bg-gradient-to-r from-red-600 via-red-700 to-amber-600 text-white hover:brightness-110 shadow-sm animate-pulse" 
                  : "text-muted-foreground cursor-not-allowed"
              )}
              title="Generate image with Gemini 2.0 Flash Image Generation"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            type="submit" 
            size="icon"
            disabled={(message.trim() === '' && selectedFiles.length === 0) || isLoading}
            className={cn(
              "h-8 w-8 rounded-lg transition-all",
              (message.trim() || selectedFiles.length > 0) && !isLoading
                ? "bg-gradient-to-r from-red-600 via-red-700 to-amber-600 text-white hover:brightness-110 shadow-sm animate-pulse" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            title="Send message"
          >
            {isLoading ? (
              <Square className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-x-0 -top-1 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-pulse" />
      )}
    </form>
  );
};

export default ChatInput;
