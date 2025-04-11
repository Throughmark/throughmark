import Anthropic from "@anthropic-ai/sdk";

import { env } from "../../utils/env.js";
import { INITIAL_ANALYSIS_PROMPT } from "../analyzer.js";
import type { LLMClient, LLMResponse, InitialResponse } from "../types.js";

export class AnthropicClient implements LLMClient {
  private model: string;

  constructor(
    private apiKey?: string,
    model?: string
  ) {
    this.apiKey = apiKey || env.anthropicApiKey;
    this.model = model || "claude-3-5-sonnet-latest";
  }

  getModel = (): string => this.model;

  async analyze(imageBuffer: Buffer, prompt?: string): Promise<LLMResponse> {
    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    const base64Image = imageBuffer.toString("base64");
    const fullPrompt = `${INITIAL_ANALYSIS_PROMPT}\n\nAnalyze this image: ${
      prompt || "Analyze the damage."
    }\n\nRemember to respond with ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: fullPrompt,
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    // Return both text and usage data
    return {
      text: response.content[0].type === "text" ? response.content[0].text : "",
      usage: {
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0,
      },
    };
  }

  async analyzePair(
    originalImage: Buffer,
    gridImage: Buffer,
    prompt?: string,
    temperature = 0.7
  ): Promise<InitialResponse> {
    console.log(`AnthropicClient: Sending images (temp: ${temperature})`);
    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    const fullPrompt = `${INITIAL_ANALYSIS_PROMPT}\n\nAnalyze these images: ${
      prompt || "Analyze the damage."
    }\n\nThe first image is the original scene, and the second image shows the grid overlay.\n\nRemember to respond with ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: fullPrompt },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: originalImage.toString("base64"), // Original clear image
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: gridImage.toString("base64"), // Image with grid for location
              },
            },
          ],
        },
      ],
    });

    // Parse the response text as JSON array
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    try {
      return {
        text,
        usage: {
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
        },
      };
    } catch (error) {
      console.error("Failed to parse response as cell array:", error);
      throw error;
    }
  }
}
