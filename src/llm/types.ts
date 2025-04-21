export type OpenAIModel = "gpt-4.1" | "gpt-4.1-mini";
export type AnthropicModel = "claude-3-7-sonnet-latest";

export type AnnotationType = "highlight" | "circle" | "arrow";

export interface AnnotationConfig {
  type: AnnotationType;
}

export const MODEL_PRICING = {
  "gpt-4.1": {
    input: 2.0, // $2.00/1M tokens
    output: 8.0, // $8.00/1M tokens
  },
  "gpt-4.1-mini": {
    input: 0.4, // $0.4/1M tokens
    output: 1.6, // $1.6/1M tokens
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
