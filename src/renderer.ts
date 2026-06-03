export interface Renderer {
  camera: Camera2D;
  render(imageData: Uint32Array, playgroundSize: number, antialiasing: boolean): void;
  resize(): void;
}

export type Camera2D = {
  x: number;
  y: number;
  zoom: number;
};
