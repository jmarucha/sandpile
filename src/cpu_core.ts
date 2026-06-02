import Denque from "denque";
import type { SimulationParams } from "./main";

export class CPUCore {
  public readonly playgroundSize: number;
  private readonly data: Uint32Array;

  constructor(playgroundSize = 1024) {
    if (playgroundSize % 2 !== 0) {
      throw new Error("playgroundSize must be even");
    }
    this.playgroundSize = playgroundSize;
    this.data = new Uint32Array(playgroundSize * playgroundSize);
  }

  public getRawData(): Uint32Array {
    return this.data;
  }

  public getElement(c: [number, number]): number | null {
    const idx = this.coordinateToIndex(c);
    if (idx == null) return null;
    return this.data[idx];
  }

  public animate(params: SimulationParams) {
    const start = performance.now();
    if (params.stableGrains < 6) return;
    this.setElement([0, 0], (n: number) => n + params.grainsPerFrame);
    this.processUpdates(new Denque([[0, 0]] as [number, number][]), params);
    const end = performance.now();
    console.log(`${end - start} ms`);
  }

  private coordinateToIndex(c: [number, number]): number | null {
    const x = c[0] + this.playgroundSize / 2;
    const y = c[1] + this.playgroundSize / 2;
    if (x < 0 || y < 0 || x >= this.playgroundSize || y >= this.playgroundSize) {
      return null;
    }
    return this.playgroundSize * y + x;
  }

  private setElement(c: [number, number], setter: (n: number) => number) {
    const idx = this.coordinateToIndex(c);
    if (idx == null) return;
    this.data[idx] = setter(this.data[idx]);
  }

  private static getNeighbours(c: [number, number]): [number, number][] {
    const x = c[0];
    const y = c[1];
    return [
      [x - 1, y - 1],
      [x - 1, y],
      [x, y - 1],
      [x, y + 1],
      [x + 1, y],
      [x + 1, y + 1],
    ];
  }

  private processUpdates(
    updateQueue: Denque<[number, number]>,
    params: SimulationParams,
  ) {
    while (updateQueue.length > 0) {
      const result = this.processUpdate(updateQueue.shift()!, params);
      for (const r of result) {
        updateQueue.push(r);
      }
    }
  }

  private processUpdate(
    coordinate: [number, number],
    params: SimulationParams,
  ): [number, number][] {
    const count = this.getElement(coordinate);
    if (count == null) return [];
    if (count <= params.stableGrains) return [];

    const toAdd = Math.floor(count / 6);
    const remainder = count % 6;
    this.setElement(coordinate, () => remainder);

    const neighbours = CPUCore.getNeighbours(coordinate);
    for (const c of neighbours) {
      this.setElement(c, (n: number) => n + toAdd);
    }
    return neighbours;
  }
}
