import { describe, it, expect, vi } from "vitest";

import { AnthropicClient } from "./anthropic";

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: '{"test": "response"}' }],
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      }),
    };
  },
}));

describe("AnthropicClient", () => {
  it("should return parsed response with usage", async () => {
    const client = new AnthropicClient();
    const buffer = Buffer.from("test-image");
    const result = await client.analyze(buffer, "test prompt");

    expect(result).toEqual({
      text: '{"test": "response"}',
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    });
  });
});
