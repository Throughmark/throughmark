import type { AnnotationContext } from "./types.js";

export class CircleAnnotation {
  render(ctx: AnnotationContext): string {
    const { cells, cellWidth, cellHeight } = ctx;
    if (!cells.length) return this.renderEmpty();

    // Calculate bounding box
    const minX = Math.min(...cells.map(c => c.x));
    const maxX = Math.max(...cells.map(c => c.x)) + cellWidth;
    const minY = Math.min(...cells.map(c => c.y));
    const maxY = Math.max(...cells.map(c => c.y)) + cellHeight;

    // Calculate center and radii
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const radiusX = ((maxX - minX) / 2) * 1.1;
    const radiusY = ((maxY - minY) / 2) * 1.15; // Slightly taller

    // Create a hand-drawn looking shape with multiple offset paths
    const paths = [];
    const steps = 36;

    // Draw 2-4 slightly offset shapes
    const numPaths = 2 + Math.floor(Math.random() * 3);
    for (let offset = 0; offset < numPaths; offset++) {
      const points = [];
      const offsetX = (Math.random() - 0.5) * 5;
      const offsetY = (Math.random() - 0.5) * 5;

      // Slight random scaling per path
      const scaleX = 1 + (Math.random() - 0.5) * 0.1;
      const scaleY = 1 + (Math.random() - 0.5) * 0.1;

      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        // More wobble at the sides than top/bottom
        const wobbleX = Math.random() * 6 - 3;
        const wobbleY = Math.random() * 4 - 2;

        // Calculate point with constrained radius
        const x =
          centerX + offsetX + (radiusX * scaleX + wobbleX) * Math.cos(angle);
        const y =
          centerY + offsetY + (radiusY * scaleY + wobbleY) * Math.sin(angle);

        points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
      }
      paths.push(
        `<path d="${points.join(" ")} Z" fill="none" stroke="#f00" stroke-width="3" stroke-opacity="0.5"/>`
      );
    }

    return paths.join("\n");
  }

  private renderEmpty(): string {
    return `
      <circle
        cx="0"
        cy="0"
        r="0"
        fill="none"
        stroke="#f00"
        stroke-width="2"
        stroke-opacity="0.8"
      />
    `;
  }
}
