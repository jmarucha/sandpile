import Denque from "denque";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

let width: number;
let height: number;
let imageData: ImageData;
let buf: Uint32Array;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  imageData = ctx.createImageData(width, height);
  buf = new Uint32Array(imageData.data.buffer);
}

resize();
window.addEventListener("resize", resize);

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

function colorFor(value: number | null): number {
  if (value != null)
    return COLORS[value];
  else
    return 0xff050505;
}

// Camera state
let camX = 0;
let camY = 0;
let zoom = 8;

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
  camX -= (e.clientX - dragLastX) / zoom;
  camY -= (e.clientY - dragLastY) / zoom;
  dragLastX = e.clientX;
  dragLastY = e.clientY;
});

window.addEventListener("mouseup", () => { dragging = false; });

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  // zoom toward mouse pointer
  const mx = (e.clientX - width / 2) / zoom + camX;
  const my = (e.clientY - height / 2) / zoom + camY;
  zoom *= factor;
  camX = mx - (e.clientX - width / 2) / zoom;
  camY = my - (e.clientY - height / 2) / zoom;
}, { passive: false });

function frame(_t: number) {
  const invZoom = 1 / zoom;

  for (let y = 0; y < height; ++y) {
    const cy = (y - height / 2) * invZoom + camY;
    for (let x = 0; x < width; ++x) {
      const cx = (x - width / 2) * invZoom + camX;
      const nearestElement = getNearestElementCoords([cx, cy]);
      const val = getElement(nearestElement);
      buf[y * width + x] = colorFor(val);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(frame);
}

function getNearestElementCoords(cameraCoords: [number,number]): [number,number] {
  const mapCoords: [number,number] = [cameraCoords[0]+1/Math.sqrt(3)*cameraCoords[1], 2*cameraCoords[1]/Math.sqrt(3)];
  const fullPart: [number,number] = [Math.floor(mapCoords[0]), Math.floor(mapCoords[1])];
  const fracPart: [number, number] = [mapCoords[0]-fullPart[0], mapCoords[1]-fullPart[1]]

  let [x, y] = fracPart;
  // vorenoi cells are like
  // AAA*****
  // AA *****
  // ----- BB
  // -----BBB
  if (y > 0.5*(x+1) && y > 2*x)
    return [fullPart[0], fullPart[1]+1] // A
  if (y < 0.5*x && y < 2*x-1)
    return [fullPart[0]+1, fullPart[1]] // B
  if (y > 1-x)
    return [fullPart[0]+1, fullPart[1]+1] // *
  return fullPart; // -
}

const PLAYGROUND_SIZE: number = 1024 // must be even. fuck.
const data = new Uint32Array(PLAYGROUND_SIZE * PLAYGROUND_SIZE);

function getElement(c:[number,number]): number | null {
  const x = c[0] + PLAYGROUND_SIZE/2;
  const y = c[1] + PLAYGROUND_SIZE/2;
  if (x < 0 || y < 0 || x >= PLAYGROUND_SIZE || y >= PLAYGROUND_SIZE) {
    return null;
  }
  return data[PLAYGROUND_SIZE*y+x]
}

function setElement(c:[number,number], setter: Function) {
  const x = c[0] + PLAYGROUND_SIZE/2;
  const y = c[1] + PLAYGROUND_SIZE/2;
  if (x < 0 || y < 0 || x >= PLAYGROUND_SIZE || y >= PLAYGROUND_SIZE) {
    return null;
  }
  data[PLAYGROUND_SIZE*y+x] = setter(data[PLAYGROUND_SIZE*y+x])
}

// Hex neighbours
function getNeighbours(c:[number,number]): [number,number][] {
  const x = c[0];
  const y = c[1];
  return [ //hexagonal
    [x-1, y-1],
    [x-1, y],
    [x, y-1],
    [x, y+1],
    [x+1, y],
    [x+1, y+1],
  ]
}

const params = {
  stableGrains: 6,
  grainsPerFrame: 1,
};
const ruleset = (n: number) => n <= params.stableGrains;

function processUpdates(updateQueue: Denque<[number, number]>) {
  while (updateQueue.length > 0) {
    const result = processUpdate(updateQueue.shift()!);

    for (const r of result) {
      updateQueue.push(r);
    }
  }
  console.log("update");
}

function processUpdate(coordinate: [number, number]): [number, number][] {
  let count = getElement(coordinate);
  if (count == null) return [];
  if (ruleset(count)) return [];

  let toAdd = Math.floor(count/6);
  let remainder = count % 6
  setElement(coordinate, ()=>remainder);

  const neighbours = getNeighbours(coordinate)
  for (const c of neighbours) {
    setElement(c, (n: number)=>n+toAdd)
  }
  return neighbours
}

function animate() {
  const start = Date.now();
  if (params.stableGrains < 6) return;
  setElement([0,0], (n:number)=>n+params.grainsPerFrame)
  processUpdates(new Denque([[0,0]] as [number,number][]));
  const end = Date.now();
  console.log(`${end-start} ms`)
}

// GUI
function makeSlider(label: string, min: number, max: number, initial: number, log: boolean, onChange: (v: number) => void) {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:8px;margin:4px 0;color:#ccc;font:12px monospace;";
  const lbl = document.createElement("span");
  lbl.style.width = "100px";
  lbl.textContent = label;
  const val = document.createElement("span");
  val.style.width = "50px";
  val.style.textAlign = "right";
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "1000";
  input.style.flex = "1";

  const toSlider = log
    ? (v: number) => Math.round(1000 * Math.log(v / min) / Math.log(max / min))
    : (v: number) => Math.round(1000 * (v - min) / (max - min));
  const fromSlider = log
    ? (s: number) => Math.round(min * Math.pow(max / min, s / 1000))
    : (s: number) => Math.round(min + (max - min) * s / 1000);

  input.value = String(toSlider(initial));
  val.textContent = String(initial);

  input.addEventListener("input", () => {
    const v = fromSlider(Number(input.value));
    val.textContent = String(v);
    onChange(v);
  });

  row.append(lbl, input, val);
  return row;
}

const panel = document.createElement("div");
panel.style.cssText = "position:fixed;top:8px;right:8px;background:rgba(0,0,0,0.7);padding:8px 12px;border-radius:6px;z-index:10;";
panel.append(
  makeSlider("Stable", 6, 24, params.stableGrains, false, (v) => { params.stableGrains = v; }),
  makeSlider("Grains/step", 1, 10000, params.grainsPerFrame, true, (v) => { params.grainsPerFrame = v; }),
);
document.body.append(panel);

(window as any).animate = animate;
(window as any).setElement = setElement;
(window as any).frame = frame;

requestAnimationFrame(frame);
setInterval(animate, 10);
