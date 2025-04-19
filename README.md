# Throughmark: Describe features, get image annotations

|                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
|  <img alt="Before" src="https://private-user-images.githubusercontent.com/2158187/435365462-da7a73dc-8e48-4a0f-9e26-d55ab332db24.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDQwMTEsIm5iZiI6MTc0NTA0MzcxMSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2NTQ2Mi1kYTdhNzNkYy04ZTQ4LTRhMGYtOWUyNi1kNTVhYjMzMmRiMjQuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDYyMTUxWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9NGI4OTgwMmVjYTVhYzA1NjJmYWNjOTBlOTQzODdjOWU3MWI2M2M4OGQyZWY5NzdhMWU4YzFiNDMwM2EyOWY1MSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.qxpDL1uwvHiD1ABeJY5tcPk9AZ6v564SdC6WQb1IlkY"> Input: image and prompt "find toothbrushes"  | <img alt="After" src="https://private-user-images.githubusercontent.com/2158187/435365446-338fb607-4ea9-44b7-90b7-15e8a85402a6.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDQzMTQsIm5iZiI6MTc0NTA0NDAxNCwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2NTQ0Ni0zMzhmYjYwNy00ZWE5LTQ0YjctOTBiNy0xNWU4YTg1NDAyYTYuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDYyNjU0WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9NzM3YzRkMDRjMmIyNWQxNzM5NGFjNGM4YTg2NDIwYjkwMGMyMzljMjMwZGI4ZjZjZTRkYzdjZmY3NjVmMzhiOCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.3ngs1swNjkG9J4u0Jy15Cs-BysCNiQ9SUOMxEzR4HX0"> Output: Annotation, labeling, and highlighting |
| <img src="https://private-user-images.githubusercontent.com/2158187/435367576-c9da486e-8c2f-433b-b921-8b76c1f1c1f2.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDU3ODksIm5iZiI6MTc0NTA0NTQ4OSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2NzU3Ni1jOWRhNDg2ZS04YzJmLTQzM2ItYjkyMS04Yjc2YzFmMWMxZjIucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDY1MTI5WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9ZGUyNTMwYTQ1ZGVkZDM3ODgzZWRlNDI5YjQ0OTc5NzViNWM5ZmY5ZmYyM2QwYjhlNzhjOGUzYmFlOWU0N2Q1MSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.NTpa50X0Yzm6MNxFUfOW1culD3grYiOZS3LhTr0lsTE"> Input: image and prompt "where is Atlantis rumored to be?" |                           <img src="https://private-user-images.githubusercontent.com/2158187/435367560-34a4f9f9-bd4f-4199-85bf-f2eb035abd20.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDU3ODksIm5iZiI6MTc0NTA0NTQ4OSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2NzU2MC0zNGE0ZjlmOS1iZDRmLTQxOTktODViZi1mMmViMDM1YWJkMjAucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDY1MTI5WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9MzdmOWQ1YmIzNDkyNGEzZDQxODY3ZTM3NDMzYzg3MjRlMmZjODZmMTBiMDYxMmUyNmUzYjg1M2E0MjNiOTViMiZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.hyjQ30PStSxaJCRzk4R9a39wUIF2dio-f2zTCqlfV2Y"> Output                           |
|                       <img src="https://private-user-images.githubusercontent.com/2158187/435367913-cb4a7800-6d3a-40f7-a74e-8ff1bd139872.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDYwNDEsIm5iZiI6MTc0NTA0NTc0MSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2NzkxMy1jYjRhNzgwMC02ZDNhLTQwZjctYTc0ZS04ZmYxYmQxMzk4NzIuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDY1NTQxWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9ZTA4ODA1NjdkNTUzZGVhZTY3OTZkNTI4NWZhOTVkOTM0MDc0NDVmNmM4MzY3N2YwMTFiNjk3ZWE3OGRkNWQ4ZSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.UHZ3txxEOBz8zlCJzQC4zXzZIYOy9KkUstfufOcCH4w"> "Find threats"                       |                           <img src="https://private-user-images.githubusercontent.com/2158187/435367904-4224d961-21c6-4b6e-b5a1-e5aac4891360.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDYwNDEsIm5iZiI6MTc0NTA0NTc0MSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2NzkwNC00MjI0ZDk2MS0yMWM2LTRiNmUtYjVhMS1lNWFhYzQ4OTEzNjAuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDY1NTQxWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9NGExNTU3YWRhNWY1ZTZhYmFmZmJmZjdiOGYyNmU5ZGUwMjM1OWQ2NTYwNzU0ODYzYWI1MjlkYjJiMjdlYWI3OSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.GclYd9VzlVa8yW3MjB4wDxPU-k2FAp31RCQEF5i7y7A"> Output                           |
|                       <img src="https://private-user-images.githubusercontent.com/2158187/435368560-0d46dd50-c8bd-424c-a3cd-acbf1ff56401.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDY2MDMsIm5iZiI6MTc0NTA0NjMwMywicGF0aCI6Ii8yMTU4MTg3LzQzNTM2ODU2MC0wZDQ2ZGQ1MC1jOGJkLTQyNGMtYTNjZC1hY2JmMWZmNTY0MDEuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDcwNTAzWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9Y2M3NjZmOWRhNjY5ZWM5N2Y1NjE4YWZkYTFhNzU1M2FjOGZhZDQ3ZGI0MThjMmRlZTRhZGI4MDQ1Mzg3YThjNyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.lipd233naBx07n7uh5x-s6Xeb5r3YjyJUukvoGcmJaM"> "Find damage"                        |                           <img src="https://private-user-images.githubusercontent.com/2158187/435368568-f7b2e36a-b72c-4596-a3d6-5890e954f387.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDY2MDMsIm5iZiI6MTc0NTA0NjMwMywicGF0aCI6Ii8yMTU4MTg3LzQzNTM2ODU2OC1mN2IyZTM2YS1iNzJjLTQ1OTYtYTNkNi01ODkwZTk1NGYzODcuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDcwNTAzWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9OGZiNGQzODg2YmFmYjJlZjUxNmNjY2E2NjExNzU2M2JhOTQ1YTE3ZDExMzYzODdjMTBlZDBlMjQ0ZjU2YmE5YiZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.6T0WH9dSygY_eXkkpyQ7KT1XsAKsE6pn0DVUbWsnG4M"> Output                           |
|                       <img src="https://private-user-images.githubusercontent.com/2158187/435368539-8509871d-db4d-4819-9415-430f784d2d5a.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDY1NzksIm5iZiI6MTc0NTA0NjI3OSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2ODUzOS04NTA5ODcxZC1kYjRkLTQ4MTktOTQxNS00MzBmNzg0ZDJkNWEuanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDcwNDM5WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9MzhiZjgyMmIxMDY5NTYxNWY1ZGQ4ZDI1ZmQxOGRlOWUzYzBlMjZiYWViZTUwZGMwODgyODBiMjM5NDQ2OGIxMyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.pdfwbPJGXdGwCR2Y71PA16f-xTsFYyJq6PlPkPqkCiY"> "Find damage"                        |                           <img src="https://private-user-images.githubusercontent.com/2158187/435368535-98851151-7551-4a54-889d-934d34b53a98.jpg?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDUwNDY1NzksIm5iZiI6MTc0NTA0NjI3OSwicGF0aCI6Ii8yMTU4MTg3LzQzNTM2ODUzNS05ODg1MTE1MS03NTUxLTRhNTQtODg5ZC05MzRkMzRiNTNhOTguanBnP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDQxOSUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA0MTlUMDcwNDM5WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9Y2NlYjgzNDI5ODY2NDcyMDMwMjJhZjNhYzVhYjY5YTE5ZTA5Y2RjODBjNTUzOTU2N2EzM2I0NmEyYjA4MGI3NyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.2DWAKxWwBdnjPgCBzpjEuZSXPycCxXVOmAQan9onugA"> Output                           |

Throughmark is an intelligent image analysis system that goes beyond traditional
computer vision. Instead of fixed categories, it enables ad-hoc, on-demand
identification of any visual features using the power of large language models.

Unlike systems that use AI to recreate or modify images, Throughmark preserves
the original image exactly as is, overlaying a dynamic grid system for precise
spatial identification. This approach ensures perfect image fidelity while
leveraging off-the-shelf LLMs for analysis.

By overlaying a dynamic grid system and leveraging off-the-shelf LLMs,
Throughmark can:

- Identify arbitrary regions of interest based on natural language prompts
- Provide detailed descriptions of what it finds
- Generate precise spatial coordinates for each identified region
- Validate results against ground truth when available

Unlike traditional computer vision APIs that are limited to predefined
categories, Throughmark can adapt to any analysis task - from concrete ("find
rust spots") to abstract ("identify tense moments") to complex ("locate areas
showing signs of structural weakness"). The system can understand and analyze:

- Technical details: "Find signs of water damage in this building inspection"
- Subjective qualities: "Identify confrontational body language in this security
  footage"
- Complex patterns: "Locate areas where the paint shows signs of improper
  application"
- Abstract concepts: "Find visual elements that create a sense of unease"

All through simple natural language prompts, with precise spatial identification
of relevant regions.

## Features

- **Grid-based region identification**: Dynamically computes grid dimensions
  based on image size and overlays a spreadsheet-style grid (e.g. A1, B2).
- **Multiple LLM Providers**: Supports both OpenAI and Anthropic, with
  configurable models.
- **Consensus Analysis**: Runs several analysis passes (default is 3) at
  different temperatures for robust cell identification.
- **Two-Pass Workflow**: An initial pass to identify grid cells followed by a
  verification pass that groups cells into regions.
- **Adaptive Grid Dimensions**: Automatically adjusts cell sizes based on image
  resolution.
- **Batch Processing**: Process entire directories of images.
- **Accuracy Metrics and Cost Tracking**: Generates detailed JSON output that
  includes region descriptions, token usage, and cost estimates.
- **Truth Files**: Supports a JSON truth file format (grid cell IDs).
- **Ground Truth Validation**: Supports validation against Open Images Dataset
  bounding box annotations for accuracy measurement.
- **Flexible Prompt Configuration**: Supports hierarchical prompt configuration:
  1. Image-specific prompts (e.g. `car1.prompt.txt`)
  2. Directory-level prompts (`prompt.txt`)
  3. Command-line arguments
  4. Default prompts

## Installation

1. Clone the repository.
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up your environment:

   - Copy `.env.sample` to `.env`:
     ```bash
     cp .env.sample .env
     ```
   - Add your API keys to `.env`:

   ```bash
   ANTHROPIC_API_KEY=your_key_here  # For Anthropic
   OPENAI_API_KEY=your_key_here     # For OpenAI
   ```

   Note: You only need the API key(s) for the provider(s) you plan to use.

## API Usage

You can use Throughmark programmatically:

```typescript
import { Throughmark } from "throughmark";

// Basic usage with LLM options
const throughmark = new Throughmark({
  llm: {
    provider: "openai", // or "anthropic"
    model: "gpt-4o", // optional; defaults to provider-specific model
    numPasses: 4, // number of initial analysis passes (default: 4)
  },
});

// Example with multiple annotation types
const throughmark = new Throughmark({
  annotations: [
    {
      type: "highlight", // highlight regions
    },
    {
      type: "circle", // draw circles around regions
    },
    {
      type: "arrow", // add arrows pointing to regions
    },
  ],
});

// Or use defaults (highlight only)
const defaultThroughmark = new Throughmark();

// Analyze an image
const analysis = await throughmark.analyze({
  imagePath: "image.jpg",
  prompt: "Identify all rust spots",
  contiguousRegions: true, // Attempts to force touching cells into the same region
});

// Generate annotated image
const annotated = await analysis.render();

// Generate verification image with grid overlay
const verification = await analysis.renderVerification();
```

### Configuration

Set your API keys as described above.

#### LLM Options

- **provider**: Which LLM provider to use ("openai" or "anthropic").
- **model**: The model to use (defaults to `gpt-4o` for OpenAI and
  `claude-3-5-sonnet-latest` for Anthropic).
- **numPasses**: Number of initial analyses to run (default is **3**). Higher
  values may improve accuracy but also increase cost.

#### Analysis Options

- **contiguousRegions**: When true, forces all touching cells (including
  diagonal) to be grouped into the same region. Useful for identifying
  physically connected components or preventing over-segmentation.

### Output Format

For each analyzed image, Throughmark's CLI generates several files:

- **{image}.jpg** - The annotated image with highlighted regions and labels
- **{image}.verification.jpg** - Internal grid overlay used for verification
  pass
- **{image}.json** - Analysis results including:
  - Identified regions with cell coordinates
  - Region descriptions and titles
  - Overall image summary
  - Token usage and cost metrics
- **{image}.truth.jpg** - (When ground truth available) Visualization of ground
  truth boxes

For example, analyzing `car1.jpg` produces:

```
output/
├── car1.jpg              # Highlighted regions
├── car1.verification.jpg # Grid overlay
├── car1.json            # Analysis data
└── car1.truth.jpg       # Ground truth (if available)
```

## Command Line Interface

Throughmark includes two CLI tools for quick testing and batch processing.

### Single Image Analysis

```bash
# Basic usage with default settings
pnpm start

# Specify provider and model with custom prompts
pnpm start <image> <provider> <model> "<prompt>"
# Examples:
pnpm start samples/automobile/car1.jpg openai gpt-4o "Find rust spots"
pnpm start samples/automobile/car1.jpg anthropic claude-3-5-sonnet-latest "Find damage"
```

The CLI supports a hierarchical prompt configuration:

1. Image-specific prompt file (e.g. `car1.prompt.txt`)
2. Directory prompt file (`prompt.txt`)
3. Command-line argument
4. Default prompt ("Find all threats")

### Batch Processing

Process multiple images in a directory:

```bash
# Process all images in a directory
pnpm batch samples/automobile

# Specify arguments in order: <directory> <provider> <model> "<prompt>"
pnpm batch samples/automobile openai gpt-4o "Find damage to cars"

# Default settings if no arguments provided
pnpm batch  # Uses samples/Toothbrush directory that contains ground truth
```

The batch processor:

- Processes JPG and PNG images
- Runs 5 images concurrently
- Saves analysis results to `output/` directory
- Generates accuracy metrics when ground truth available
- Shows token usage and cost summary
- Uses the same prompt hierarchy as single image mode

### Output Files

For each analyzed image, Throughmark's CLI generates several files:

- **{image}.jpg** - The annotated image with highlighted regions and labels
- **{image}.verification.jpg** - Internal grid overlay used for verification
  pass
- **{image}.json** - Analysis results including:
  - Identified regions with cell coordinates
  - Region descriptions and titles
  - Overall image summary
  - Token usage and cost metrics
- **{image}.truth.jpg** - (When ground truth available) Visualization of ground
  truth boxes

For example, analyzing `car1.jpg` produces:

```
output/
├── car1.jpg              # Highlighted regions
├── car1.verification.jpg # Grid overlay
├── car1.json            # Analysis data
└── car1.truth.jpg       # Ground truth (if available)
```

### Example Outputs

Sample outputs can be found in the `example_output/` subdirectory of each
category:

```
samples/
├── class-descriptions-boxable.csv      # Ground truth class mappings
├── validation-annotations-bbox.csv      # Ground truth bounding boxes
├── automobile/                         # Car damage examples
│   ├── car*.jpg                       # Input images
│   ├── example_output/
│   │   ├── car1.jpg                   # Annotated output
│   │   ├── car1.verification.jpg      # Internal grid used for verification
│   │   └── car1.json                  # Analysis results
│   └── prompt.txt                     # Category prompt
├── misc/                              # Miscellaneous examples
│   ├── *.jpg, *.png                  # Input images
│   ├── *.prompt.txt                  # Per-image prompts
│   └── example_output/
│       ├── threat.jpg
│       ├── threat.verification.jpg
│       └── threat.json
└── Toothbrush/                        # Ground truth examples
    ├── *.jpg                         # Input images with ground truth
    ├── example_output/
    │   ├── c8806ee2d08139ce.jpg
    │   ├── c8806ee2d08139ce.verification.jpg
    │   ├── c8806ee2d08139ce.truth.jpg  # Ground truth visualization
    │   └── c8806ee2d08139ce.json
    └── prompt.txt
```

Each example shows:

- Annotated output image
- Verification image with grid overlay
- Analysis JSON with regions and metrics
- Ground truth visualization (Toothbrush examples only)

### Ground Truth Validation

Throughmark validates analysis results against ground truth bounding boxes.
Ground truth data comes from the
[Open Images Dataset](https://github.com/cvdfoundation/open-images-dataset#download-images-with-bounding-boxes-annotations),
using two key files in the `samples/` directory:

- `class-descriptions-boxable.csv`: Maps class IDs to human-readable labels
- `validation-annotations-bbox.csv`: Contains the bounding box coordinates

You can see this in action in the `samples/Toothbrush` directory, or create new
test sets:

```bash
# Run the TypeScript file directly
npx jiti src/bin/extractImages.ts Car
```

Note: The `extractImages.ts` script requires that all images from the Open
Images Dataset be placed in the `samples/all/` directory. These images are not
included in the GitHub repository due to their large number and size. You'll
need to download the images separately and place them in this directory before
using the extraction feature.

When converting bounding boxes to grid cells, Throughmark:

- Maps normalized coordinates (0-1) to grid positions
- Requires a minimum overlap threshold (default 10%) for a cell to be included
- Calculates overlap area to determine which cells the box covers

### Prompt Configuration

When using the command line tools, prompts can be configured at different
levels:

1. **Image-specific prompts**: Create a file named `<image>.prompt.txt`:

   ```
   samples/automobile/car1.prompt.txt
   ```

2. **Directory-level prompts**: Create a `prompt.txt` in the directory:

   ```
   samples/automobile/prompt.txt
   ```

3. **Command-line argument**:

   ```bash
   pnpm start image.jpg openai gpt-4o "Custom prompt"
   ```

4. **Default prompts**: Built into the commands
   - CLI: "Find all threats"
   - Batch: "Highlight toothbrushes"

## How It Works

1. **Grid Overlay**:

   - Dynamically calculates grid cell dimensions based on the image resolution
     and configurable options.
   - Overlays a spreadsheet-style grid (e.g. A1, B2) on the image.

2. **Initial Analysis**:

   - Performs multiple parallel analyses (default: 3 passes) with varying
     temperatures.
   - Uses consensus among passes to decide which grid cells contain the
     specified features.

3. **Verification**:

   - A second pass verifies and organizes the detected cells into regions.
   - A highlighted image is generated for visual inspection.

4. **Output**:
   - Produces a JSON file with region descriptions, cell coordinates, token
     usage, and cost.
   - Generates a highlighted image that visualizes the detected regions.

## Contributing

We welcome contributions! Please read our
[Contributing Guidelines](CONTRIBUTING.md) before submitting any changes.
