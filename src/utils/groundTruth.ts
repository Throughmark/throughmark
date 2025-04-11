import { createReadStream } from "fs";
import { join } from "path";

import { parse as csvParse } from "csv-parse";

export const CSV = {
  IMAGE_ID: 0,
  SOURCE: 1,
  LABEL_NAME: 2,
  CONFIDENCE: 3,
  XMIN: 4,
  XMAX: 5,
  YMIN: 6,
  YMAX: 7,
} as const;

export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export type Annotation = [
  string, // imageId
  string, // annotationType
  string, // classId
  string, // unused
  string, // xmin
  string, // ymin
  string, // xmax
  string, // ymax
  ...string[], // other fields
];

async function getClassCode(category: string): Promise<string | undefined> {
  const classDescriptions = await loadClassDescriptions();
  return classDescriptions.get(category.trim().toLowerCase());
}

async function getAnnotations(
  imageId: string,
  classCode: string
): Promise<Annotation[]> {
  const annotations = await loadAnnotations();
  return annotations
    .filter(
      row => row[CSV.IMAGE_ID] === imageId && row[CSV.LABEL_NAME] === classCode
    )
    .map(row => {
      const xmin = parseFloat(row[CSV.XMIN]);
      const xmax = parseFloat(row[CSV.XMAX]);
      const ymin = parseFloat(row[CSV.YMIN]);
      const ymax = parseFloat(row[CSV.YMAX]);
      return [
        row[CSV.IMAGE_ID],
        row[CSV.SOURCE],
        row[CSV.LABEL_NAME],
        row[CSV.CONFIDENCE],
        xmin.toString(),
        ymin.toString(),
        xmax.toString(),
        ymax.toString(),
        ...row.slice(CSV.YMAX + 1),
      ] as Annotation;
    });
}

export async function getGroundTruthBoxes(
  imageId: string,
  category: string
): Promise<Annotation[]> {
  // Get class code for category
  const classCode = await getClassCode(category);
  if (!classCode) {
    throw new Error(`No class code found for category ${category}`);
  }

  // Get annotations for this image and class
  const annotations = await getAnnotations(imageId, classCode);
  return annotations;
}

export const loadClassDescriptions = async () =>
  new Promise<Map<string, string>>((resolve, reject) => {
    const classMap = new Map<string, string>();
    createReadStream(
      join(process.cwd(), "samples", "class-descriptions-boxable.csv")
    )
      .pipe(csvParse({ delimiter: ",", trim: true }))
      .on("data", (row: [string, string]) => {
        classMap.set(row[1].trim().toLowerCase(), row[0]);
      })
      .on("end", () => resolve(classMap))
      .on("error", reject);
  });

export const loadAnnotations = async () =>
  new Promise<Annotation[]>((resolve, reject) => {
    const annotations: Annotation[] = [];
    createReadStream(
      join(process.cwd(), "samples", "validation-annotations-bbox.csv")
    )
      .pipe(csvParse({ delimiter: ",", trim: true }))
      .on("data", (row: Annotation) => annotations.push(row))
      .on("end", () => resolve(annotations))
      .on("error", reject);
  });
