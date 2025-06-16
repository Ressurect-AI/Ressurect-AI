
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIModel } from '@/services/aiService';

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => (
  <div className="flex items-center space-x-2">
    <span className="text-sm text-muted-foreground">Model:</span>
    <Select value={selectedModel} onValueChange={onModelChange}>
      <SelectTrigger className="w-[320px] h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* Gemini Models */}
        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
        <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</SelectItem>
        <SelectItem value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview</SelectItem>
        <SelectItem value="gemma-3n-e4b-it">Gemma 3n E4B Instruction Tuned</SelectItem>
        
        {/* SambaNova Models */}
        <SelectItem value="Meta-Llama-3.3-70B-Instruct">Meta Llama 3.3 70B Instruct</SelectItem>
        <SelectItem value="Qwen3-32B">Qwen3 32B</SelectItem>
        <SelectItem value="DeepSeek-R1-Distill-Llama-70B">DeepSeek R1 Distill Llama 70B</SelectItem>
        <SelectItem value="DeepSeek-V3-0324">DeepSeek V3 0324</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default ModelSelector;
