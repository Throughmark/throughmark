import { describe, it, expect, vi, beforeEach } from "vitest";

import { OpenAIClient } from "./openai";

const mockCreate = vi.fn().mockResolvedValue({
  choices: [{ message: { content: '{"regions":[], "summary":"test"}' } }],
});

vi.mock("openai", () => ({
  default: function () {
    return {
      chat: {
        completions: { create: mockCreate },
      },
    };
  },
}));

describe("OpenAIClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass image and prompt to API", async () => {
    const client = new OpenAIClient();
    const buffer = Buffer.from("test-image");
    await client.analyze(buffer, "test prompt");

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: expect.arrayContaining([
              expect.objectContaining({ text: "test prompt" }),
              expect.objectContaining({ type: "image_url" }),
            ]),
          }),
        ]),
      })
    );
  });
});
