#!/usr/bin/env node

/**
 * Usage:
 *   Run the script with a target keyword (e.g., "Car") as a command line argument.
 *   Example:
 *     node src/bin/extractImages.js Car
 *   If no argument is provided, "Car" will be used as the default target keyword.
 *
 *   The script:
 *     - Reads class descriptions from "../../samples/class-descriptions-boxable.csv".
 *     - Reads annotation data from "../../samples/validation-annotations-bbox.csv".
 *     - Copies images from "../../samples/all/" whose annotation class includes the target keyword
 *       into a folder at "../../samples/<targetKeyword>/".
 */

import { createReadStream } from "fs";
import { promises as fsPromises } from "fs";
import { parse } from "csv-parse";
import path from "path";
import { fileURLToPath } from "url";

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the target keyword from the command line arguments (default to "Car")
const TARGET_KEYWORD = process.argv[2] || "Car";

// Define paths to CSV files and image directories (assuming 'samples/' is at the project root)
const CLASS_DESC_CSV = path.join(
  __dirname,
  "../../samples/class-descriptions-boxable.csv"
);
const ANNOTATIONS_CSV = path.join(
  __dirname,
  "../../samples/validation-annotations-bbox.csv"
);
const ALL_IMAGES_DIR = path.join(__dirname, "../../samples/all");
// Destination will be created as samples/<targetKeyword>
const TARGET_DIR = path.join(__dirname, `../../samples/${TARGET_KEYWORD}`);

/**
 * Loads the class descriptions into a Map where:
 *   key = classId
 *   value = description
 */
const loadClassDescriptions = async () =>
  new Promise((resolve, reject) => {
    const classMap = new Map();
    createReadStream(CLASS_DESC_CSV)
      .pipe(parse({ delimiter: ",", trim: true }))
      .on("data", row => {
        const [classId, description] = row;
        if (classId && description) {
          classMap.set(classId, description);
        }
      })
      .on("end", () => resolve(classMap))
      .on("error", error => reject(error));
  });

/**
 * Processes the annotations CSV and returns a Set of image IDs
 * that have an annotation whose class description contains the TARGET_KEYWORD.
 */
const processAnnotations = async classMap =>
  new Promise((resolve, reject) => {
    const imageIds = new Set();
    createReadStream(ANNOTATIONS_CSV)
      .pipe(parse({ delimiter: ",", trim: true }))
      .on("data", row => {
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
      .on("error", error => reject(error));
  });

/**
 * Copies image files identified by imageIds from ALL_IMAGES_DIR to TARGET_DIR.
 */
const copyImages = async imageIds => {
  // Ensure the target directory exists.
  await fsPromises.mkdir(TARGET_DIR, { recursive: true });

  for (const imageId of imageIds) {
    const srcPath = path.join(ALL_IMAGES_DIR, `${imageId}.jpg`);
    const destPath = path.join(TARGET_DIR, `${imageId}.jpg`);
    try {
      await fsPromises.copyFile(srcPath, destPath);
      console.log(`Copied ${imageId}.jpg`);
    } catch (error) {
      console.error(`Error copying ${imageId}.jpg: ${error.message}`);
    }
  }
};

const main = async () => {
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
    console.error("Error:", error);
  }
};

main();
