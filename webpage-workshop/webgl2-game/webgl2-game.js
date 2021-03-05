
/**
 * Main function
 */
function main () {
    const globWidth = window.innerWidth;
    const globHeight = window.innerHeight;

    const glCanvas = document.getElementById("webgl-canvas");
    setupCanvas(glCanvas, globWidth, globHeight);

    const gl = glCanvas.getContext("webgl2");
    setupWebGL(gl);

    const ctxCanvas = document.getElementById("ctx-canvas");
    setupCanvas(ctxCanvas, globWidth, globHeight);

    const ctx = ctxCanvas.getContext("2d");
    setupCTX(ctx);

    gl.viewport(0, 0, globWidth, globHeight);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const program = createProgramFromScript(gl, "terrain-vertex", "terrain-fragment");

}

/**
 * Setup WebGL
 * @param {WebGL2RenderingContext} gl
 * @returns {void}
 */
function setupWebGL (gl) {
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
}

/**
 * Create a WebGL shader
 * @param {WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader}
 */
function createShader (gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

/**
 * Create a WebGL program from script id
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertexId
 * @param {string} fragmentId
 * @returns {WebGLProgram}
 */
function createProgramFromScript (gl, vertexId, fragmentId) {
    const vsSource = document.getElementById(vertexId).text.trim();
    const fsSource = document.getElementById(fragmentId).text.trim();

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
}

/**
 * Setup the ctx
 * @param {CanvasRenderingContext2D} ctx
 */
function setupCTX (ctx) {
    // Nothing yet
}

/**
 * Setup a canvas
 * @param {HTMLCanvasElement} canvas
 * @param {number} width
 * @param {numer} height
 */
function setupCanvas (canvas, width, height) {
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width;
    canvas.height = height;
}

/**
 * Determine what attributes a shader uses
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} source
 * @param {Object} target
 */
function scrapeAttributes (gl, program, source, target) {
    const lines = source.split("\n");
    const n = lines.length;
    for (let i = 0; i < n; i ++) {
        const line = lines[n].trim().split(";")[0];
        if (line.includes("in")) {
            let words = line.split(" ");
            let type = words[1];
            let name = words[2];
            target[name] = {
                location: gl.getAttribLocation(program, name),
                type: type
            };
        }
    }
}

/**
 * Determine what uniforms a shader uses
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {string} source
 * @param {Object} target
 */
function scrapeUniforms (gl, program, source, target) {
    const lines = source.split("\n");
    const n = lines.length;
    for (let i = 0; i < n; i ++) {
        const line = lines[n].trim().split(";")[0];
        if (line.includes("uniform")) {
            let words = line.split(" ");
            let type = words[1];
            let name = words[2];
            target[name] = {
                location: gl.getUniformLocation(program, name),
                type: type
            };
        }
    }
}
