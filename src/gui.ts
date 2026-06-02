// GUI
function makeSlider(
  label: string,
  min: number,
  max: number,
  initial: number,
  log: boolean,
  onChange: (v: number) => void,
) {
  const row = document.createElement("div");
  row.style.cssText =
    "display:flex;align-items:center;gap:8px;margin:4px 0;color:#ccc;font:12px monospace;";
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
    ? (v: number) =>
        Math.round((1000 * Math.log(v / min)) / Math.log(max / min))
    : (v: number) => Math.round((1000 * (v - min)) / (max - min));
  const fromSlider = log
    ? (s: number) => Math.round(min * Math.pow(max / min, s / 1000))
    : (s: number) => Math.round(min + ((max - min) * s) / 1000);

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

export function initializeGUI(params: any) {
  const panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;top:8px;right:8px;background:rgba(0,0,0,0.7);padding:8px 12px;border-radius:6px;z-index:10;";
  panel.append(
    makeSlider("Stable", 6, 24, params.stableGrains, false, (v) => {
      params.stableGrains = v;
    }),
    makeSlider("Grains/step", 1, 10000, params.grainsPerFrame, true, (v) => {
      params.grainsPerFrame = v;
    }),
  );
  document.body.append(panel);
}
