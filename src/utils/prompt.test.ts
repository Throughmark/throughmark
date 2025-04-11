import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

import { describe, it, expect, vi } from "vitest";

import { getPromptForImage } from "./prompt.js";

// Mock fs functions
vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("prompt", () => {
  it("should use image-specific prompt when available", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFile).mockResolvedValue("Find rust and damage");

    const prompt = await getPromptForImage(
      "samples/automobile/car1.jpg",
      "default prompt"
    );
    expect(prompt).toBe("Find rust and damage");
  });

  it("should use default prompt when no files exist", async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const prompt = await getPromptForImage(
      "samples/automobile/car1.jpg",
      "default prompt"
    );
    expect(prompt).toBe("default prompt");
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFile).mockRejectedValue(new Error());

    const prompt = await getPromptForImage(
      "samples/automobile/car1.jpg",
      "default prompt"
    );
    expect(prompt).toBe("default prompt");
  });
});
