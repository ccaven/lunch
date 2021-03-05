/* GLSL settings */
#version 100
precision highp float;

/* Uniform variables */
uniform float uTime;
uniform vec2 uScale;
uniform vec3 uCameraPosition;
uniform mat3 uCameraMatrix;
uniform vec3 uLightDirection;

/* March settings */
const int MAXSTEPS = 200;
const float EPSILON = 0.001;
const float HALF_EPSILON = EPSILON * 0.5;
const float MAXDIST = 200.0;
const float MAXOFF = 20.0;
const float SQRT3 = 1.7320508;
const float PI = 3.1415926;
const float HALF_PI = 1.570796;
const float PI2_3 = 2.0943951;
const float PI4_3 = 4.1887902;
const float SPECULAR_EXPONENT = 16.0;

/* Helper functions */
vec3 hue2rgb (float hue) {
    return 0.5 + 0.5 * vec3(
        cos(hue),
        cos(hue + PI2_3), 
        cos(hue + PI4_3));
}

/* Space deformations */        
void fold_plane (inout vec4 z, vec3 normal, float offset) {
    z.xyz -= normal * 2.0 * min(dot(z.xyz, normal) - offset, 0.0);
}

void fold_abs (inout vec4 z, vec3 center) {
    z.xyz = abs(z.xyz - center) + center;
}

void fold_sierpinski (inout vec4 z) {
    z.xy -= min(z.x + z.y, 0.0);
    z.xz -= min(z.x + z.z, 0.0);
    z.yz -= min(z.y + z.z, 0.0);
}

void fold_scale (inout vec4 z, float factor) {
    z *= factor;
}

void fold_translate (inout vec4 z, vec3 o) {
    z.xyz += o;
}

void fold_box (inout vec4 z, vec3 corners) {
    z.xyz = clamp(z.xyz, -corners, corners) * 2.0 - z.xyz;
}

void fold_menger (inout vec4 z) {
    const vec2 k = vec2(-1.0, 1.0);
    z.xy += k * min(z.x - z.y, 0.0);
    z.xz += k * min(z.x - z.z, 0.0);
    z.yz += k * min(z.y - z.z, 0.0);
}

void fold_sphere (inout vec4 z, float a, float b) {
    float r2 = dot(z.xyz, z.xyz);
    r2 = max(b / max(a, r2), 1.0);
    z *= r2;
}



/* Primitives */
float sdf_sphere (vec4 z, float r) {
    return (length(z.xyz) - r) / z.w;
}

float sdf_box (vec4 z, vec3 c) {
    vec3 a = abs(z.xyz) - c;
    return (min(max(max(a.x, a.y), a.z), 0.0) + length(max(a, 0.0))) / z.w;
}

/* Distance estimator */
struct de_out {
    float distance;
    float orbitTrap;
};

de_out de (vec3 pos) {
    de_out o;
    o.orbitTrap = 0.0;

    vec4 z = vec4(pos, 1.0);

    fold_scale(z, 2.0);
    fold_box(z, vec3(1.0));
    fold_sphere(z, 0.3, 1.5);

    o.distance = sdf_sphere(z, 1.0);
    return o;
}

/* Raymarch code */
struct rm_out {
    float distance;
    float glow;
    vec3 hit;
    vec3 color;
};

rm_out rm (vec3 ro, vec3 rd) {
    rm_out o;
    o.glow = 100.0;
    o.distance = 0.0;
    o.hit = ro.xyz;
    for (int steps = 0; steps < MAXSTEPS; steps ++) {
        de_out d = de(o.hit);
        o.hit += rd * d.distance;
        o.glow = min(o.glow, d.distance);
        o.distance += d.distance;
        if (d.distance < EPSILON) {
            o.color = hue2rgb(d.orbitTrap);
            return o;
        }
    }
    o.color = vec3(0.0);
    o.distance = -1.0;
    return o;
}

vec3 sn (vec3 z) {
    // Credit to Inigo Quilez for this tetrahedron normal
    const vec2 k = vec2(1, -1);
    return normalize(
        k.xyy * de( z + k.xyy * HALF_EPSILON ).distance + 
        k.yyx * de( z + k.yyx * HALF_EPSILON ).distance + 
        k.yxy * de( z + k.yxy * HALF_EPSILON ).distance + 
        k.xxx * de( z + k.xxx * HALF_EPSILON ).distance);
}

/* Main method */
void main () {
    vec2 uv = 1.0 - 2.0 * uScale * gl_FragCoord.xy;
    
    vec3 ray = normalize(vec3(uv, 1.0)) * uCameraMatrix;

    rm_out rmInfo = rm(uCameraPosition, ray);

    if (rmInfo.distance < 0.0) {
        float glow = exp(-rmInfo.glow * 10.0);
        gl_FragColor = vec4(vec3(glow), 1);
        return;
    }

    vec3 normal = sn(rmInfo.hit);
    float diffuse = max(-dot(normal, uLightDirection), 0.0);
    float specular = -dot(reflect(ray, normal), uLightDirection);
    specular = pow(max(specular, 0.0), SPECULAR_EXPONENT);

    float shade = diffuse * 0.7 + specular * 0.2 + 0.1;

    gl_FragColor = vec4(shade * rmInfo.color, 1.0);
}