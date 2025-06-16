
// Enhanced AI service that supports multiple models with file upload and image generation
import { generateResponse, GeminiModel, generateGeminiImage } from './geminiService';
import { generateSambaNovaResponse, SambaNovaModel } from './sambaNovaService';
import { generateImageWithAI } from './imageService';

// Unified AI model type that includes all supported models
export type AIModel = GeminiModel | SambaNovaModel;

export const generateAIResponse = async (
  message: string, 
  model: AIModel, 
  files?: File[]
): Promise<string> => {
  console.log('=== AI SERVICE: Generating response ===');
  console.log('Model:', model);
  console.log('Message:', message);
  console.log('Files:', files?.length || 0);
  
  // Check if it's an image generation request
  const imageKeywords = ['generate image', 'create image', 'draw', 'make image', 'picture of', 'photo of'];
  const isImageRequest = imageKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  if (isImageRequest) {
    console.log('Image generation request detected');
    return generateImageWithAI(message, model);
  }
  
  // Check if it's a SambaNova model
  const sambaNovaModels: SambaNovaModel[] = [
    'Meta-Llama-3.3-70B-Instruct',
    'Qwen3-32B', 
    'DeepSeek-R1-Distill-Llama-70B',
    'DeepSeek-V3-0324'
  ];
  
  if (sambaNovaModels.includes(model as SambaNovaModel)) {
    return generateSambaNovaResponse(message, model as SambaNovaModel);
  }
  
  // Otherwise, use Gemini (supports file uploads)
  return generateResponse(message, model as GeminiModel, files);
};

// New function specifically for Gemini 2.0 Flash image generation
export const generateGeminiImageResponse = async (prompt: string): Promise<string> => {
  console.log('=== AI SERVICE: Generating Gemini image ===');
  console.log('Prompt:', prompt);
  
  return generateGeminiImage(prompt);
};
