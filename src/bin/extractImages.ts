#!/usr/bin/env jiti

/**
 * Extract Images Script
 *
 * This script extracts images and their ground truth annotations from the Open Images Dataset
 * for a specific category.
 *
 * Usage:
 *   npx jiti src/bin/extractImages.ts <category>
 *
 * Example:
 *   npx jiti src/bin/extractImages.ts Car
 *
 * Requirements:
 *   - Images must be placed in samples/all/ directory
 *   - class-descriptions-boxable.csv and validation-annotations-bbox.csv must be in samples/
 *
 * The script will:
 *   - Read class descriptions from "../../samples/class-descriptions-boxable.csv"
 *   - Read annotation data from "../../samples/validation-annotations-bbox.csv"
 *   - Copy images from "../../samples/all/" whose annotation class includes the target keyword
 *     into a folder at "../../samples/<category>/"
 */

import { createReadStream } from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { parse } from "csv-parse";

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the target keyword from the command line arguments (default to "Car")
const TARGET_KEYWORD: string = process.argv[2] || "Car";

// Define paths to CSV files and image directories (assuming 'samples/' is at the project root)
const CLASS_DESC_CSV: string = path.join(
  __dirname,
  "../../samples/class-descriptions-boxable.csv"
);
const ANNOTATIONS_CSV: string = path.join(
  __dirname,
  "../../samples/validation-annotations-bbox.csv"
);
const ALL_IMAGES_DIR: string = path.join(__dirname, "../../samples/all");
// Destination will be created as samples/<targetKeyword>
const TARGET_DIR: string = path.join(
  __dirname,
  `../../samples/${TARGET_KEYWORD}`
);

/**
 * Loads the class descriptions into a Map where:
 *   key = classId
 *   value = description
 */
const loadClassDescriptions = async (): Promise<Map<string, string>> =>
  new Promise((resolve, reject) => {
    const classMap = new Map<string, string>();
    createReadStream(CLASS_DESC_CSV)
      .pipe(parse({ delimiter: ",", trim: true }))
      .on("data", (row: string[]) => {
        const [classId, description] = row;
        if (classId && description) {
          classMap.set(classId, description);
        }
      })
      .on("end", () => resolve(classMap))
      .on("error", (error: Error) => reject(error));
  });

/**
 * Processes the annotations CSV and returns a Set of image IDs
 * that have an annotation whose class description contains the TARGET_KEYWORD.
 */
const processAnnotations = async (
  classMap: Map<string, string>
): Promise<Set<string>> =>
  new Promise((resolve, reject) => {
    const imageIds = new Set<string>();
    createReadStream(ANNOTATIONS_CSV)
      .pipe(parse({ delimiter: ",", trim: true }))
      .on("data", (row: string[]) => {
        // Expected row format: [ imageId, annotationType, classId, ... ]
        const imageId = row[0];
        const classId = row[2];
        if (imageId && classId) {
          const description = classMap.get(classId);
          if (
            description &&
            description.toLowerCase().includes(TARGET_KEYWORD.toLowerCase())
          ) {
            imageIds.add(imageId);
          }
        }
      })
      .on("end", () => resolve(imageIds))
      .on("error", (error: Error) => reject(error));
  });

/**
 * Copies image files identified by imageIds from ALL_IMAGES_DIR to TARGET_DIR.
 */
const copyImages = async (imageIds: Set<string>): Promise<void> => {
  // Ensure the target directory exists.
  await fsPromises.mkdir(TARGET_DIR, { recursive: true });

  for (const imageId of imageIds) {
    const srcPath = path.join(ALL_IMAGES_DIR, `${imageId}.jpg`);
    const destPath = path.join(TARGET_DIR, `${imageId}.jpg`);
    try {
      await fsPromises.copyFile(srcPath, destPath);
      console.log(`Copied ${imageId}.jpg`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error copying ${imageId}.jpg: ${error.message}`);
      } else {
        console.error(`Error copying ${imageId}.jpg: Unknown error`);
      }
    }
  }
};

const main = async (): Promise<void> => {
  try {
    console.log(`Target keyword: "${TARGET_KEYWORD}"`);
    console.log("Loading class descriptions...");
    const classMap = await loadClassDescriptions();

    console.log("Processing annotations...");
    const imageIds = await processAnnotations(classMap);
    console.log(
      `Found ${imageIds.size} images with class containing "${TARGET_KEYWORD}".`
    );

    console.log("Copying images...");
    await copyImages(imageIds);
    console.log("Done.");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error occurred");
    }
  }
};

main();
