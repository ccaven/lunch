
function getText (filename) {
   fetch(filename).then(response => response.text()).then(text => console.log(text));
}

function main () {
    const fsSource = getText("./worley-noise.glsl");
    const vsSource = `attribute vec2 aPosition; void main () { gl_Position = vec4(aPosition, 0.0, 1.0); }`;
    console.log(fsSource);
}