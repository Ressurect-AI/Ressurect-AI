
// AI Image Generation Service
import { supabase } from '@/integrations/supabase/client';
import { AIModel } from './aiService';

export const generateImageWithAI = async (prompt: string, model: AIModel): Promise<string> => {
  try {
    console.log('Starting image generation with prompt:', prompt);
    
    // Extract the actual image prompt from the message
    const imagePrompt = extractImagePrompt(prompt);
    
    // Call the image generation edge function
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt: imagePrompt,
        model: model
      }
    });
    
    if (error) {
      console.error('Error generating image:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
    
    if (data?.imageUrl) {
      return `Here's the image I generated for you:\n\n![Generated Image](${data.imageUrl})\n\n**Prompt:** ${imagePrompt}`;
    } else {
      throw new Error('No image URL returned from the service');
    }
    
  } catch (error) {
    console.error('Image generation error:', error);
    return `I apologize, but I encountered an error while generating the image: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

const extractImagePrompt = (message: string): string => {
  // Remove common prefixes to extract the actual image description
  const patterns = [
    /generate\s+(?:an?\s+)?image\s+of\s+/i,
    /create\s+(?:an?\s+)?image\s+of\s+/i,
    /draw\s+(?:an?\s+)?/i,
    /make\s+(?:an?\s+)?image\s+of\s+/i,
    /(?:picture|photo)\s+of\s+/i,
  ];
  
  let prompt = message;
  for (const pattern of patterns) {
    prompt = prompt.replace(pattern, '');
  }
  
  return prompt.trim() || message;
};
