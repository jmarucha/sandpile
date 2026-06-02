import type { Camera2D } from "./main";
import * as twgl from "twgl.js";
import vs from "./shaders/quad.vert.glsl?raw";
import fs from "./shaders/sandpile.frag.glsl?raw";
export class WebGLRenderer {
    camera: Camera2D;

    private readonly canvas: HTMLCanvasElement;
    private readonly gl: WebGL2RenderingContext;
    private width: number;
    private height: number;

    private dataTexture: WebGLTexture;
    private programInfo: twgl.ProgramInfo;
    private bufferInfo: twgl.BufferInfo;

    constructor(canvas: HTMLCanvasElement, camera: Camera2D) {
        this.canvas = canvas;
        this.camera = camera;
        this.width = canvas.width;
        this.height = canvas.height;
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            throw new Error("Could not get WebGL2 context");
        }
        this.gl = gl;
        this.dataTexture = gl.createTexture()!;
        this.programInfo = twgl.createProgramInfo(gl, [vs, fs]);

        // fullscreen quad: two triangles covering clip space
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
            position: {
                numComponents: 2,
                data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1],
            },
        });

        gl.clearColor(0, 0, 0, 1);
        this.resize();
    }

    public render(imageData: Uint32Array, playgroundSize: number) {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.dataTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            playgroundSize,
            playgroundSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array(imageData.buffer),
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.useProgram(this.programInfo.program);
        twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
        twgl.setUniforms(this.programInfo, {
            u_data: this.dataTexture,
            u_resolution: [this.width, this.height],
            u_camPos: [this.camera.x, this.camera.y],
            u_zoom: this.camera.zoom,
        });
        twgl.drawBufferInfo(gl, this.bufferInfo);
    }

    public resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.width, this.height);
    }
}
