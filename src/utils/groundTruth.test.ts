import { createReadStream } from "fs";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { getGroundTruthBoxes, CSV } from "./groundTruth.js";

// Mock fs.createReadStream
vi.mock("fs", () => ({
  createReadStream: vi.fn((path: string) => ({
    pipe: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function (event, handler) {
      if (event === "data") {
        // Mock class descriptions data
        if (path.includes("class-descriptions")) {
          handler(["/m/01g317", "Person"]);
          handler(["/m/0cmf2", "Toothbrush"]);
        }
        // Mock annotations data
        else {
          handler([
            "d102f4fbef4e708b", // imageId
            "xclick", // source
            "/m/0cmf2", // classId (Toothbrush)
            "1", // confidence
            "0.050541516", // xmin
            "0.20938627", // xmax
            "0.26895306", // ymin
            "1", // ymax
          ]);
        }
      }
      if (event === "end") handler();
      return this;
    }),
  })),
}));

describe("groundTruth", () => {
  beforeEach(() => {
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should get ground truth boxes for an image", async () => {
    const boxes = await getGroundTruthBoxes("d102f4fbef4e708b", "Toothbrush");

    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual(
      expect.arrayContaining([
        "d102f4fbef4e708b",
        "xclick",
        "/m/0cmf2",
        "1",
        "0.050541516", // xmin
        "0.26895306", // ymin
        "0.20938627", // xmax
        "1", // ymax
      ])
    );
  });

  it("should handle unknown categories", async () => {
    // Expect the function to throw an error
    await expect(
      getGroundTruthBoxes("d102f4fbef4e708b", "NonexistentCategory")
    ).rejects.toThrow("No class code found for category NonexistentCategory");

    // Verify process.exit was not called since we're throwing an error instead
    expect(process.exit).not.toHaveBeenCalled();
  });
});
