import type { Camera2D, Renderer } from "./renderer";

export class CPURenderer implements Renderer {
  camera: Camera2D;

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private imageData: ImageData;
  private buf: Uint32Array;

  constructor(canvas: HTMLCanvasElement, camera: Camera2D) {
    this.canvas = canvas;
    this.camera = camera;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get 2D context");
    }
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.imageData = ctx.createImageData(this.width, this.height);
    this.buf = new Uint32Array(this.imageData.data.buffer);
    this.resize();
  }

  public render(imageData: Uint32Array, playgroundSize: number, _antialiasing: boolean) {
    const invZoom = 1 / this.camera.zoom;

    for (let y = 0; y < this.height; ++y) {
      const cy = (y - this.height / 2) * invZoom + this.camera.y;
      for (let x = 0; x < this.width; ++x) {
        const cx = (x - this.width / 2) * invZoom + this.camera.x;
        const nearestElement = getNearestElementCoords([cx, cy]);
        const val = getElement(nearestElement, imageData, playgroundSize);
        this.buf[y * this.width + x] = colorFor(val);
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }
  public resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.buf = new Uint32Array(this.imageData.data.buffer);
  }
}

function colorFor(val: number | null): number {
  if (val == null) return 0xff000000;
  else if (val < COLORS.length) return COLORS[val];
  else return 0xff050505;
}

const COLORS = [
  0xff000000, // 0: black
  0xff552200, // 1: dark brown
  0xff0055aa, // 2: teal
  0xff00aaff, // 3: orange
  0xff00ddff, // 4: yellow
  0xff44ffff, // 5: bright yellow
  0xffffffff, // 6: white
  0xffff88ff, // 7: pink
  0xffff44ff, // 8+: magenta
  0xffff33ff,
  0xffff22ff,
  0xffff11ff,
  0xffff00ff,
  0xffdd00dd,
  0xffaa00aa,
  0xff990099,
  0xff550055,
];

function getNearestElementCoords(
  cameraCoords: [number, number],
): [number, number] {
  const mapCoords: [number, number] = [
    cameraCoords[0] + (1 / Math.sqrt(3)) * cameraCoords[1],
    (2 * cameraCoords[1]) / Math.sqrt(3),
  ];
  const fullPart: [number, number] = [
    Math.floor(mapCoords[0]),
    Math.floor(mapCoords[1]),
  ];
  const fracPart: [number, number] = [
    mapCoords[0] - fullPart[0],
    mapCoords[1] - fullPart[1],
  ];

  const [x, y] = fracPart;
  // Voronoi cells are like
  // AAA*****
  // AA *****
  // ----- BB
  // -----BBB
  if (y > 0.5 * (x + 1) && y > 2 * x) return [fullPart[0], fullPart[1] + 1]; // A
  if (y < 0.5 * x && y < 2 * x - 1) return [fullPart[0] + 1, fullPart[1]]; // B
  if (y > 1 - x) return [fullPart[0] + 1, fullPart[1] + 1]; // *
  return fullPart; // -
}

function getElement(
  c: [number, number],
  imageData: Uint32Array,
  playgroundSize: number,
): number | null {
  const x = c[0] + playgroundSize / 2;
  const y = c[1] + playgroundSize / 2;
  if (x < 0 || y < 0 || x >= playgroundSize || y >= playgroundSize) {
    return null;
  }
  return imageData[playgroundSize * y + x];
}
