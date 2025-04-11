import { extname } from "path";

import { describe, it, expect } from "vitest";

describe("batch processing", () => {
  it("should filter both jpg and png files", async () => {
    const files = [
      "test1.jpg",
      "test2.png",
      "test3.txt",
      "test4.JPG",
      "test5.PNG",
    ];
    const filtered = files.filter(file =>
      [".jpg", ".png"].includes(extname(file).toLowerCase())
    );
    expect(filtered).toEqual([
      "test1.jpg",
      "test2.png",
      "test4.JPG",
      "test5.PNG",
    ]);
  });
});
