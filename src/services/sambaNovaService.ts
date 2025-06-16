
import { supabase } from '@/integrations/supabase/client';

export type SambaNovaModel = 
  | 'Meta-Llama-3.3-70B-Instruct'
  | 'Qwen3-32B'
  | 'DeepSeek-R1-Distill-Llama-70B'
  | 'DeepSeek-V3-0324';

export const generateSambaNovaResponse = async (message: string, model: SambaNovaModel): Promise<string> => {
  try {
    console.log('Starting SambaNova API call with model:', model);
    
    // Get the API key from Supabase secrets via edge function
    const { data, error } = await supabase.functions.invoke('get-sambanova-key');
    
    if (error) {
      console.error('Error getting SambaNova API key:', error);
      throw new Error('Failed to get SambaNova API key');
    }

    const apiKey = data?.apiKey;
    if (!apiKey) {
      throw new Error('SambaNova API key not found');
    }

    console.log('API key retrieved, making SambaNova API call');

    const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SambaNova API error response:', errorText);
      throw new Error(`SambaNova API error: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('SambaNova API response received:', responseData);
    
    const responseText = responseData.choices[0]?.message?.content || 'No response generated';
    console.log('Generated response text:', responseText);
    
    return responseText;
  } catch (error) {
    console.error('Error generating SambaNova response:', error);
    if (error instanceof Error) {
      throw new Error(`SambaNova API Error: ${error.message}`);
    }
    throw new Error('Failed to generate response from SambaNova API');
  }
};
