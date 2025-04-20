export type OpenAIModel = "gpt-4o" | "gpt-4o-mini";
export type AnthropicModel = "claude-3-7-sonnet-latest";

export type AnnotationType = "highlight" | "circle" | "arrow";

export interface AnnotationConfig {
  type: AnnotationType;
}

export const MODEL_PRICING = {
  "gpt-4o": {
    input: 2.5, // $2.50/1M tokens
    output: 10.0, // $10.00/1M tokens
  },
  "gpt-4o-mini": {
    input: 0.15, // $0.15/1M tokens
    output: 0.6, // $0.60/1M tokens
  },
  "claude-3-7-sonnet-latest": {
    input: 3.0, // $3.00/1M tokens
    output: 15.0, // $15.00/1M tokens
  },
} as const;

export interface LLMConfig {
  provider: "anthropic" | "openai";
  apiKey?: string;
  model?: string;
  numPasses?: number; // Number of initial passes (default: 5)
  client?: LLMClient;
}

export interface LLMResponse {
  text: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface InitialResponse {
  text: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface LLMClient {
  analyze(imageBuffer: Buffer, prompt?: string): Promise<LLMResponse>;
  analyzePair(
    originalImage: Buffer,
    gridImage: Buffer,
    prompt?: string,
    temperature?: number
  ): Promise<InitialResponse>;
  getModel(): string;
}
