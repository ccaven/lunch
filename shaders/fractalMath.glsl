
void reflectPoint (inout vec3 point, in vec3 normal, in vec3 planeCenter) {
    point -= 2.0 * dot(point - planeCenter, normal);
}

void squareComplex (inout vec2 point) {
    point.xy = vec2(point.x * point.x - point.y * point.y, point.x * point.y * 2);
}

void squareComplex (inout vec4 point) {
    point.xyzw = vec4(
        point.x * point.x - point.y * point.y - point.z * point.z - point.w * point.w,
        2.0 * point.x * point.y,
        2.0 * point.x * point.z,
        2.0 * point.x * point.w
    );
}

