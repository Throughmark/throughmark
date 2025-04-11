import path from "path";

import { describe, it, expect, vi, afterEach } from "vitest";

import { Throughmark } from "./Throughmark.js";

const TEST_IMAGE = path.join(process.cwd(), "/samples/automobile/car0.jpg");

// Mock Anthropic client
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              regions: [
                {
                  title: "Test Region",
                  description: "Test description",
                  cells: ["A1", "A2", "B1"],
                  details: "Test details",
                },
              ],
              summary: "Test summary",
            }),
          },
        ],
      }),
    };
  },
}));

describe("Throughmark", () => {
  afterEach(() => {
    vi.resetModules();
  });

  describe("Core Functionality", () => {
    it("should generate HTML with grid", async () => {
      const throughmark = new Throughmark();
      const html = await throughmark.generateHTML(TEST_IMAGE);

      // Only check for essential elements
      expect(html).toContain("<div");
      expect(html).toContain("<svg");
      expect(html).toContain("<line"); // Has grid lines
      expect(html).toContain("<text"); // Has some labels
    });

    it("should analyze images", async () => {
      const throughmark = new Throughmark();
      const analysis = await throughmark.analyze({
        imagePath: TEST_IMAGE,
        prompt: "Test prompt",
      });

      expect(analysis.regions).toBeDefined();
      expect(Array.isArray(analysis.regions)).toBe(true);
      expect(analysis.summary).toBeDefined();
    });

    it("should generate highlighted output", async () => {
      const throughmark = new Throughmark();
      const analysis = {
        regions: [
          {
            title: "Test Region",
            description: "Test description",
            cells: ["A1", "A2", "B1"],
            details: "Test details",
          },
        ],
        summary: "Test summary",
      };

      const buffer = await throughmark.generateSimpleHighlight({
        imagePath: TEST_IMAGE,
        analysis,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("Grid Dimensions", () => {
    it("should calculate grid dimensions for an image", async () => {
      const throughmark = new Throughmark();
      const dimensions = await throughmark.getGridDimensions(TEST_IMAGE);

      expect(dimensions.gridConfig.rows).toBeGreaterThan(0);
      expect(dimensions.gridConfig.cols).toBeGreaterThan(0);
      expect(dimensions.cellWidth).toBeGreaterThan(0);
      expect(dimensions.cellHeight).toBeGreaterThan(0);
    });

    it("should update analyzer with new grid dimensions", async () => {
      const throughmark = new Throughmark();
      await throughmark.getGridDimensions(TEST_IMAGE);

      const config = throughmark.getGridConfig();
      expect(config.rows).toBeGreaterThan(0);
      expect(config.cols).toBeGreaterThan(0);
    });
  });

  describe("Annotations", () => {
    it("should pass annotations config to Analysis", async () => {
      const throughmark = new Throughmark({
        annotations: [{ type: "highlight" }],
      });

      const analysis = await throughmark.analyze({
        imagePath: TEST_IMAGE,
        prompt: "Test prompt",
      });

      // Verify Analysis was created with annotations
      expect(analysis["annotations"]).toEqual([{ type: "highlight" }]);
    });

    it("should handle empty annotations array", async () => {
      const throughmark = new Throughmark({
        annotations: [],
      });

      const analysis = await throughmark.analyze({
        imagePath: TEST_IMAGE,
        prompt: "Test prompt",
      });

      expect(analysis["annotations"]).toEqual([]);
    });
  });
});
