import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join, basename, dirname, parse } from "path";

import chalk from "chalk";

/**
 * Gets the prompt to use for image analysis, following precedence:
 * 1. Image-specific prompt file (filename.prompt.txt)
 * 2. Directory-level prompt file (prompt.txt)
 * 3. CLI argument or default prompt
 *
 * @param imagePath - Path to the image being analyzed
 * @param defaultPrompt - Fallback prompt from CLI or default value
 * @param quiet - Whether to suppress console output
 * @returns The prompt to use for analysis
 */
export async function getPromptForImage(
  imagePath: string,
  defaultPrompt: string,
  quiet = false
): Promise<string> {
  const parsedPath = parse(imagePath);
  const category = basename(dirname(imagePath));

  if (dirname(imagePath).includes("samples/") && category !== "samples") {
    try {
      // 1. Check for image-specific prompt (e.g., car1.prompt.txt)
      const imagePromptPath = join(
        dirname(imagePath),
        `${parsedPath.name}.prompt.txt`
      );
      if (existsSync(imagePromptPath)) {
        const imagePrompt = await readFile(imagePromptPath, "utf-8");
        if (!quiet) {
          console.log(
            chalk.blue(`📝 Using image prompt: "${imagePrompt.trim()}"`)
          );
        }
        return imagePrompt.trim();
      }

      // 2. Check for category prompt (prompt.txt)
      const promptPath = join(dirname(imagePath), "prompt.txt");
      if (existsSync(promptPath)) {
        const categoryPrompt = await readFile(promptPath, "utf-8");
        if (!quiet) {
          console.log(
            chalk.blue(`📝 Using directory prompt: "${categoryPrompt.trim()}"`)
          );
        }
        return categoryPrompt.trim();
      }
    } catch {
      // Silently fall back to default prompt
    }
  }
  // 3. Use CLI arg or default
  if (!quiet) {
    console.log(chalk.blue(`📝 Using default prompt: "${defaultPrompt}"`));
  }
  return defaultPrompt;
}
