import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI, Modality } from '@google/genai';
import { supabase } from '@/integrations/supabase/client';

export type GeminiModel = 
  | 'gemini-2.0-flash' 
  | 'gemini-2.0-flash-lite'
  | 'gemini-2.5-flash-preview-05-20'
  | 'gemma-3n-e4b-it';

// Standard text generation using the old SDK
export const generateResponse = async (
  message: string, 
  model: GeminiModel = 'gemini-2.0-flash',
  files?: File[]
): Promise<string> => {
  try {
    console.log('Starting Gemini API call with model:', model);
    console.log('Files provided:', files?.length || 0);
    
    // Get the API key from Supabase secrets via edge function
    const { data, error } = await supabase.functions.invoke('get-gemini-key');
    
    if (error) {
      console.error('Error getting Gemini API key:', error);
      throw new Error('Failed to get Gemini API key');
    }

    const apiKey = data?.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    console.log('API key retrieved, making Gemini API call');

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Map our model names to actual Gemini model names
    const modelMap: Record<GeminiModel, string> = {
      'gemini-2.0-flash': 'gemini-2.0-flash',
      'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
      'gemini-2.5-flash-preview-05-20': 'gemini-2.5-flash-preview-05-20',
      'gemma-3n-e4b-it': 'gemma-3n-e4b-it'
    };
    
    const actualModel = modelMap[model] || 'gemini-2.0-flash';
    console.log('Using actual model name:', actualModel);
    
    const genModel = genAI.getGenerativeModel({ model: actualModel });
    
    let result;
    
    if (files && files.length > 0) {
      // Handle file uploads - create array of content parts
      console.log('Processing files for Gemini...');
      const parts: any[] = [message];
      
      for (const file of files) {
        const fileData = await fileToGenerativePart(file);
        parts.push(fileData);
      }
      
      result = await genModel.generateContent(parts);
    } else {
      // Text-only request
      result = await genModel.generateContent(message);
    }
    
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini API response received');
    return formatResponse(text);
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error('Failed to generate response from Gemini API');
  }
};

// Fixed image generation using the new SDK with proper API implementation
export const generateGeminiImage = async (prompt: string): Promise<string> => {
  try {
    console.log('=== GEMINI IMAGE GENERATION START ===');
    console.log('Prompt:', prompt);
    
    // Get the API key from Supabase secrets via edge function
    const { data, error } = await supabase.functions.invoke('get-gemini-key');
    
    if (error) {
      console.error('Error getting Gemini API key:', error);
      throw new Error('Failed to get Gemini API key');
    }

    const apiKey = data?.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key not found');
    }

    console.log('API key retrieved for image generation');

    // Use the new GoogleGenAI SDK exactly as shown in the documentation
    const ai = new GoogleGenAI({ apiKey });
    
    console.log('Calling Gemini image generation API...');
    
    // Use the exact API format from the official documentation
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    console.log('Raw response received from Gemini');
    console.log('Response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      firstCandidate: response.candidates?.[0] ? 'exists' : 'missing'
    });
    
    // Process the response parts exactly as shown in the documentation
    if (!response.candidates || response.candidates.length === 0) {
      console.error('No candidates returned from image generation');
      throw new Error('No candidates returned from image generation');
    }
    
    const parts = response.candidates[0].content.parts;
    if (!parts || parts.length === 0) {
      console.error('No parts found in response');
      throw new Error('No content parts found in response');
    }
    
    console.log('Processing response parts:', parts.length);
    
    let textResponse = '';
    let imageBase64 = '';
    
    // Process each part exactly as in the documentation
    for (const part of parts) {
      console.log('Processing part type:', Object.keys(part));
      
      if (part.text) {
        textResponse += part.text;
        console.log('Found text part:', part.text.substring(0, 100));
      } else if (part.inlineData) {
        // Extract image data exactly as in the documentation
        imageBase64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        console.log('Found image part with mime type:', mimeType);
        console.log('Image data length:', imageBase64.length);
      }
    }
    
    if (imageBase64) {
      console.log('=== IMAGE GENERATION SUCCESSFUL ===');
      // Create blob URL from base64 instead of giant data URI
      const mimeType = 'image/png';
      const blob = b64toBlob(imageBase64, mimeType);
      const objectUrl = URL.createObjectURL(blob);
      
      // Return properly formatted markdown with shortened blob URL
      const formattedResponse = `${textResponse ? textResponse + '\n\n' : ''}![Generated Image](${objectUrl})`;
      console.log('Returning formatted response with image object URL');
      return formattedResponse;
    } else {
      console.log('=== NO IMAGE DATA FOUND ===');
      return textResponse || 'Image generation completed, but no image was returned. Please try again with a more specific prompt.';
    }
    
  } catch (error) {
    console.error('=== GEMINI IMAGE GENERATION ERROR ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw new Error(`Gemini Image Generation Error: ${error.message}`);
    }
    throw new Error('Failed to generate image with Gemini');
  }
};

// Helper function to convert File to GenerativePart
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

// Enhanced response formatting
const formatResponse = (text: string): string => {
  // Format code blocks with syntax highlighting hints
  let formatted = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return `\`\`\`${language}\n${code.trim()}\n\`\`\``;
  });
  
  // Format inline code
  formatted = formatted.replace(/`([^`]+)`/g, '`$1`');
  
  // Keep thinking sections as-is for processing in ChatMessage component
  // Don't process them here anymore
  
  // Format lists with better spacing
  formatted = formatted.replace(/^\d+\.\s/gm, '\n$&');
  formatted = formatted.replace(/^-\s/gm, '\n$&');
  
  return formatted.trim();
};

const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512): Blob => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};
