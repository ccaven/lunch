#version 100

uniform vec2 points[];
uniform int numPoints;

float calculateDistance (vec2 p) {
    float smallestDistance = 10000.0;
    for (int i = 0; i < numPoints; i ++)
        smallestDistance = min(smallestDistance, distance(points[i], p));
    return smallestDistance;
}

void main(){
    vec2 p = gl_FragCoord.xy;
    float d = calculateDistance(p);
    gl_FragColor = vec4(d, d, d, 1.0);
}

