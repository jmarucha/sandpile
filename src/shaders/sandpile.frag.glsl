#version 300 es
precision highp float;
precision highp usampler2D;
in vec2 v_uv;
out vec4 fragColor;

uniform usampler2D u_data;
uniform vec2 u_resolution;
uniform vec2 u_camPos;
uniform float u_zoom;
uniform float u_dataSize;
uniform int u_antialiasing;

// Color palette matching the original CPU renderer (RGB, 0-1)
const vec3 COLORS[17] = vec3[17](
vec3(0.00, 0.00, 0.00),
vec3(0.00, 0.13, 0.33),
vec3(0.67, 0.33, 0.00),
vec3(1.00, 0.67, 0.00),
vec3(1.00, 0.87, 0.00),
vec3(1.00, 1.00, 0.27),
vec3(1.00, 1.00, 1.00),
vec3(1.00, 0.53, 1.00),
vec3(1.00, 0.27, 1.00),
vec3(1.00, 0.20, 1.00),
vec3(1.00, 0.13, 1.00),
vec3(1.00, 0.07, 1.00),
vec3(1.00, 0.00, 1.00),
vec3(0.87, 0.00, 0.87),
vec3(0.67, 0.00, 0.67),
vec3(0.60, 0.00, 0.60),
vec3(0.33, 0.00, 0.33)
);

const float sqrt3 = 1.7320508075688772;

#define N 4

void main() {
    vec3 output_color = vec3(0.);
    for (int i = 0; i < 5; i++) {
        // Pixel coords centered at screen middle
        vec2 px = (v_uv - 0.5) * u_resolution;
        vec2 px_with_offset;
        if (u_antialiasing == 1) {
            px_with_offset = px + vec2[5](
                vec2(0., 0.),
                vec2(0., 0.25),
                vec2(0., -0.25),
                vec2(0.25, 0.),
                vec2(-0.25, 0.)
            )[i];
        } else {
            px_with_offset = px;
        }
        // World coords with camera
        vec2 world = px_with_offset / u_zoom + u_camPos;


        vec2 map = vec2(world.x + world.y / sqrt3, 2.0*world.y/sqrt3);

        vec2 full_part = floor(map);
        vec2 frac_part = map - full_part;

        if (frac_part.y > 0.5 * (frac_part.x + 1.)
            && frac_part.y > 2. * frac_part.x) map = full_part + vec2(0.,1.); // A
        else if (frac_part.y < 0.5 * frac_part.x
            && frac_part.y < 2. * frac_part.x - 1.) map = full_part + vec2(1.,0.); // B
        else if (frac_part.y > 1. - frac_part.x) map = full_part + vec2(1.,1.); // *
        else map = full_part;

        // Map to data texture UV (origin = center of data)
        vec2 dataUV = (map + 0.5) / u_dataSize + 0.5;

        // Out-of-bounds → black
        if (dataUV.x < 0.0 || dataUV.x > 1.0 || dataUV.y < 0.0 || dataUV.y > 1.0) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
        uint value = texture(u_data, dataUV).r;
        uint idx = min(value, 16u);

        if (u_antialiasing == 1) {
            output_color += COLORS[idx]/5.0;
        } else {
            output_color += COLORS[idx];
            break;
        }
    }
    fragColor = vec4(output_color, 1.);
}
