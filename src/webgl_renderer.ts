import type { Camera2D } from "./main";

export class WebGLRenderer {
    camera: Camera2D;

    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: WebGL2RenderingContext;
    private width: number;
    private height: number;

    private data_texture: WebGLTexture;

    constructor(canvas: HTMLCanvasElement, camera: Camera2D) {
        this.canvas = canvas;
        this.camera = camera;
        this.width = canvas.width;
        this.height = canvas.height;
        const ctx = canvas.getContext("webgl2");
        if (!ctx) {
            throw new Error("Could not get WebGL2 context");
        }
        this.ctx = ctx;
        this.data_texture = ctx.createTexture();
        ctx.clearColor(0, 0, 0, 1);
        this.resize();

    }

    public render(imageData: Uint32Array, playgroundSize: number) {
        this.ctx.bindTexture(this.ctx.TEXTURE_2D, this.data_texture);
        this.ctx.texImage2D(
            this.ctx.TEXTURE_2D,
            0,
            this.ctx.RGBA,
            playgroundSize,
            playgroundSize,
            0,
            this.ctx.RGBA,
            this.ctx.UNSIGNED_BYTE,
            imageData,
        );
    }
    public resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.ctx.viewport(0, 0, this.width, this.height);
    }
}