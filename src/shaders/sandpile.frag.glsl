#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_data;
uniform vec2 u_resolution;
uniform vec2 u_camPos;
uniform float u_zoom;

void main() {
    fragColor = vec4(v_uv, 0.5, 1.0);
}
