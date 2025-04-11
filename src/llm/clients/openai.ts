import OpenAI from "openai";

import { INITIAL_ANALYSIS_PROMPT } from "../analyzer.js";
import type { LLMClient, LLMResponse, InitialResponse } from "../types.js";

export class OpenAIClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(
    private apiKey?: string,
    model?: string
  ) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = model || "gpt-4o";
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  getModel = (): string => this.model;

  async analyze(imageBuffer: Buffer, prompt?: string): Promise<LLMResponse> {
    console.log("Using OpenAI model:", this.model);

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: INITIAL_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Highlight the damage.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBuffer.toString("base64")}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
      seed: 123, // For more consistent responses
      stream: false,
    });

    const message = response.choices[0]?.message?.content;
    if (!message) {
      throw new Error("No response from OpenAI");
    }

    return {
      text: message,
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
      },
    };
  }

  async analyzePair(
    originalImage: Buffer,
    gridImage: Buffer,
    prompt?: string,
    temperature = 0.7
  ): Promise<InitialResponse> {
    console.log(`Using OpenAI model: ${this.model} (temp: ${temperature})`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: "json_object" },
      temperature,
      messages: [
        {
          role: "system",
          content: INITIAL_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Analyze the damage.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${originalImage.toString(
                  "base64"
                )}`,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${gridImage.toString("base64")}`,
              },
            },
          ],
        },
      ],
    });

    return {
      text: response.choices[0]?.message?.content || "[]",
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}
