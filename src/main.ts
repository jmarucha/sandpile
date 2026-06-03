import { CPUCore } from "./cpu_core";
import { CPURenderer } from "./cpu_renderer";
import { initializeGUI, type RenderParams } from "./gui";
import type { Camera2D, Renderer } from "./renderer";
import { WebGLRenderer } from "./webgl_renderer";

export type SimulationParams = {
  stableGrains: number;
  grainsPerFrame: number;
};

const params: SimulationParams = {
  stableGrains: 6,
  grainsPerFrame: 1,
};

const cpuCore = new CPUCore();

const cam: Camera2D = { x: 0, y: 0, zoom: 8 };
const renderParams: RenderParams = { antialiasing: false };

const canvas = document.getElementById("c") as HTMLCanvasElement;

let renderer: Renderer;
try {
  renderer = new WebGLRenderer(canvas, cam);
} catch {
  console.warn("WebGL2 not available, falling back to CPU renderer");
  renderer = new CPURenderer(canvas, cam);
}

window.addEventListener("resize", () => renderer.resize());

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
    const mx = (e.clientX - canvas.width / 2) / cam.zoom + cam.x;
    const my = (e.clientY - canvas.height / 2) / cam.zoom + cam.y;
    cam.zoom *= factor;
    cam.x = mx - (e.clientX - canvas.width / 2) / cam.zoom;
    cam.y = my - (e.clientY - canvas.height / 2) / cam.zoom;
  },
  { passive: false },
);

window.addEventListener("keydown", (e) => {
  if (e.key === "a" || e.key === "A")
    renderParams.antialiasing = !renderParams.antialiasing;
});

function frame() {
  renderer.render(
    cpuCore.getRawData(),
    cpuCore.playgroundSize,
    renderParams.antialiasing,
  );
  requestAnimationFrame(frame);
}

initializeGUI(params, renderParams);

requestAnimationFrame(frame);
setInterval(() => cpuCore.animate(params), 10);
