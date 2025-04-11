import path from "path";

import { describe, it, expect } from "vitest";

import { ImageProcessor } from "./processor.js";

const TEST_IMAGE = path.join(process.cwd(), "/samples/automobile/car0.jpg");

describe("ImageProcessor", () => {
  const processor = new ImageProcessor();

  it("should get image dimensions", async () => {
    const dimensions = await processor.getDimensions(TEST_IMAGE);
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
  });

  it("should generate grid overlay", async () => {
    const buffer = await processor.transformImage({
      image: TEST_IMAGE,
      addGrid: true,
      gridConfig: {
        rows: 10,
        cols: 10,
      },
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("should generate highlighted image", async () => {
    const buffer = await processor.transformImage({
      image: TEST_IMAGE,
      addGrid: true,
      regions: [
        {
          title: "Test Region",
          description: "Test description",
          cells: ["A1", "A2", "B1"],
          details: "Test details",
        },
      ],
      gridConfig: {
        rows: 10,
        cols: 10,
      },
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
