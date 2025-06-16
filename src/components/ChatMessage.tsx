import React, { lazy } from 'react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import ReactMarkdown, { defaultUrlTransform, UrlTransform } from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Download, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Define custom URL transformer to allow blob/data schemes
const allowBlobUrlTransform: UrlTransform = (url, key, node) => {
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return defaultUrlTransform(url, key, node);
};

// Lazy-load heavy syntax-highlighter only when a code block is actually rendered
const LazySyntaxHighlighter = lazy(async () => {
  const mod = await import('react-syntax-highlighter');
  const { oneDark } = await import('react-syntax-highlighter/dist/esm/styles/prism');
  // Wrap to inject the theme automatically
  const Prism = (mod as any).Prism;
  const Component = (props: any) => (
    <Prism {...props} style={oneDark} />
  );
  return { default: Component };
});

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const isUser = message.role === 'user';
  
  // Function to download image as PNG
  const downloadImage = (imageData: string, filename: string = 'generated-image.png') => {
    try {
      console.log('Downloading image...');
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = imageData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  // Process content to handle thinking sections
  const processMessageContent = (content: string) => {
    console.log('Processing message content for display');
    
    // Extract thinking sections
    // Support both <thinking>...</thinking> and <think>...</think> tag variants
    const thinkingRegex = /<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>/gi;
    let processedContent = content;
    const thinkingSections: string[] = [];
    
    let match;
    while ((match = thinkingRegex.exec(content)) !== null) {
      thinkingSections.push(match[1].trim());
      processedContent = processedContent.replace(match[0], '');
    }
    
    console.log('Thinking sections found:', thinkingSections.length);
    console.log('Processed content:', processedContent.substring(0, 200) + '...');
    
    return { processedContent: processedContent.trim(), thinkingSections };
  };

  const { processedContent, thinkingSections } = processMessageContent(message.content);
  
  return (
    <div 
      className={cn(
        "py-4 px-6 mb-4 transition-all duration-300 ease-out animate-fade-in",
        "flex w-full items-start gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary/80 text-primary-foreground shadow-sm">
          <AvatarFallback>
            🤖
          </AvatarFallback>
        </Avatar>
      )}

      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative max-w-[80%] rounded-lg px-4 py-3 group transition-transform hover:scale-[1.02] hover:shadow-lg",
          isUser 
            ? "bg-chat-user text-white ml-auto" 
            : "bg-gradient-to-br from-red-600 via-red-700 to-amber-600 text-white mr-auto"
        )}
      >
        {/* Hover actions */}
        {isHovered && (
          <div className={cn(
            "absolute -top-3",
            isUser ? "right-0" : "left-0"
          )}>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0 bg-white/80 text-red-600 hover:bg-white dark:bg-muted/20 dark:text-red-400 dark:hover:bg-muted/30 shadow-sm"
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  toast.success('Copied!');
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0 bg-white/80 text-red-600 hover:bg-white dark:bg-muted/20 dark:text-red-400 dark:hover:bg-muted/30 shadow-sm"
                onClick={() => toast.success('Glad you liked it!')}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0 bg-white/80 text-red-600 hover:bg-white dark:bg-muted/20 dark:text-red-400 dark:hover:bg-muted/30 shadow-sm"
                onClick={() => toast.info('Thanks for the feedback!')}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {/* Display thinking sections if they exist */}
            {thinkingSections.length > 0 && (
              <div className="mb-4">
                {thinkingSections.map((thinking, index) => (
                  <details key={index} className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <summary className="cursor-pointer p-3 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg">
                      🤔 AI Thinking Process {thinkingSections.length > 1 ? `(${index + 1})` : ''}
                    </summary>
                    <div className="p-3 pt-0 text-sm text-blue-800 dark:text-blue-200 italic whitespace-pre-wrap border-t border-blue-200 dark:border-blue-800 mt-2">
                      {thinking}
                    </div>
                  </details>
                ))}
              </div>
            )}
            
            <ReactMarkdown
              urlTransform={allowBlobUrlTransform}
              components={{
                p: ({ children }) => {
                  const content = children?.toString() || '';
                  if (!content.trim()) {
                    return null;
                  }
                  return <p className="mb-3 leading-relaxed">{children}</p>;
                },
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return match ? (
                    <div className="relative my-4">
                      <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 text-xs rounded-t-md">
                        <span className="font-medium">{language.toUpperCase()}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          }}
                          className="hover:bg-gray-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <React.Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading code…</div>}>
                        <LazySyntaxHighlighter
                          language={language}
                          PreTag="div"
                          className="!mt-0 !rounded-t-none !mb-0"
                        >
                          {String(children).replace(/\n$/, '')}
                        </LazySyntaxHighlighter>
                      </React.Suspense>
                    </div>
                  ) : (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...rest}>
                      {children}
                    </code>
                  );
                },
                img: ({ src, alt, ...props }) => {
                  console.log('Rendering image with src:', src?.substring(0, 50) + '...');
                  
                  if (!src) {
                    console.error('No src provided for image');
                    return <p className="text-red-500">Image failed to load: No source provided</p>;
                  }

                  return (
                    <div className="my-4 border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <img 
                            src={src} 
                            alt={alt || 'Generated image'} 
                            className="max-w-full h-auto rounded-lg shadow-md border border-border max-h-96 object-contain"
                            onLoad={() => console.log('Image loaded successfully')}
                            onError={(e) => {
                              console.error('Image failed to load:', e);
                              console.error('Image src:', src?.substring(0, 100) + '...');
                            }}
                            {...props}
                          />
                          {alt && alt !== 'Generated image' && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {alt}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <Button
                            onClick={() => downloadImage(src, 'generated-image.png')}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download PNG
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md italic">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-3 text-primary">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mb-2 text-primary/90">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-medium mb-2 text-primary/80">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-3">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-3">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-primary">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-muted-foreground">{children}</em>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <Avatar className="h-8 w-8 bg-foreground/20 text-foreground shadow-sm">
          <AvatarFallback>
            😄
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
