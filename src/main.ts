import { CPUCore } from "./cpu_core";
import { CPURenderer } from "./cpu_renderer";
import { initializeGUI } from "./gui";

export type SimulationParams = {
  stableGrains: number;
  grainsPerFrame: number;
};

window.addEventListener("resize", () => cpuRenderer.resize());

const params: SimulationParams = {
  stableGrains: 6,
  grainsPerFrame: 1,
};

const cpuCore = new CPUCore();

export type Camera2D = {
  x: number;
  y: number;
  zoom: number;
};
// Camera state
let cam: Camera2D = { x: 0, y: 0, zoom: 8 };
const canvas = document.getElementById("c") as HTMLCanvasElement;
const cpuRenderer = new CPURenderer(canvas, cam);

// Mouse drag
let dragging = false;
let dragLastX = 0;
let dragLastY = 0;

canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  dragLastX = e.clientX;
  dragLastY = e.clientY;
});

window.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  cam.x -= (e.clientX - dragLastX) / cam.zoom;
  cam.y -= (e.clientY - dragLastY) / cam.zoom;
  dragLastX = e.clientX;
  dragLastY = e.clientY;
});

window.addEventListener("mouseup", () => {
  dragging = false;
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    // zoom toward mouse pointer
    const mx = (e.clientX - canvas.width / 2) / cam.zoom + cam.x;
    const my = (e.clientY - canvas.height / 2) / cam.zoom + cam.y;
    cam.zoom *= factor;
    cam.x = mx - (e.clientX - canvas.width / 2) / cam.zoom;
    cam.y = my - (e.clientY - canvas.height / 2) / cam.zoom;
  },
  { passive: false },
);

function frame() {
  cpuRenderer.render(cpuCore.getRawData(), cpuCore.playgroundSize);
  requestAnimationFrame(frame);
}

initializeGUI(params);

requestAnimationFrame(frame);
setInterval(() => cpuCore.animate(params), 10);

function debugCenter() {
  const R = 3; // radius — covers 37 hexes (close to 35)
  const lines: string[] = [];
  for (let y = -R; y <= R; y++) {
    const indent = " ".repeat(Math.max(0, -y) * 2);
    const row: string[] = [];
    for (let x = -R; x <= R; x++) {
      // hex constraint: skip corners outside the hex radius
      if (x + y < -R || x + y > R) continue;
      const v = getElement([x, y]);
      row.push(v === null ? " ." : String(v).padStart(3));
    }
    lines.push(indent + row.join(" "));
  }
  console.log(lines.join("\n"));
}

(window as any).debugCenter = debugCenter;
