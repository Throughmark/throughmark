# Throughmark: Describe features, get image annotations

Let's start with some examples:
|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/automobile/example_output/car0.jpg?raw=true"><br/>**"Find damage"**|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/Toothbrush/example_output/a459749f4e5769bd.jpg?raw=true"><br/>**"Find toothbrushes"**|
|:--:|:--:|
|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/structural/example_output/logs.jpg?raw=true"><br/>**"Find damage"**|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/conflict/example_output/fylkesarkivet-i-vestland-0tE9dbyGmkQ-unsplash.jpg?raw=true"><br/>**"Find primary conflict"**|
|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/structural/example_output/apt.jpg?raw=true"><br/>**"Find damage"**|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/structural/example_output/house1.jpg?raw=true"><br/>**"Find damage"**|
|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/misc/example_output/standoff.jpg?raw=true"><br/>**"Find threats"**|<img width="450" src="https://github.com/Throughmark/throughmark/blob/develop/samples/misc/example_output/world.png?raw=true"><br/>**"Find Atlantis"**|

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

```bash
# Using pnpm (recommended)
pnpm add throughmark

# Using npm
npm install throughmark

# Using yarn
yarn add throughmark
```

### Environment Setup

Throughmark requires API keys for the LLM providers you plan to use. The package
looks for environment variables in the following order:

1. `.env.local` (local overrides)
2. `.env.development`, `.env.test`, or `.env.production` (environment-specific)
3. `.env` (default)

Create a `.env` file in your project root with the following variables:

```bash
# For OpenAI
OPENAI_API_KEY=your_key_here

# For Anthropic
ANTHROPIC_API_KEY=your_key_here
```

Note: You only need to include the API key(s) for the provider(s) you plan to
use.

#### CLI Usage

When using Throughmark as a CLI tool, you can set the environment variables in
several ways:

1. Create a `.env` file in the directory where you're running the commands
2. Set them directly in your shell:
   ```bash
   export OPENAI_API_KEY=your_key_here
   export ANTHROPIC_API_KEY=your_key_here
   ```
3. Use them inline with the command:
   ```bash
   OPENAI_API_KEY=your_key_here pnpm start
   ```

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

## Output Files

For each analyzed image, Throughmark generates several files:

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
