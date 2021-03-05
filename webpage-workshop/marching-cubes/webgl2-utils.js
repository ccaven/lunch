
/**
 * Create a WebGL2 shader
 * @param {WebGL2RenderingContext} gl
 * @param {Number} type
 * @param {String} source
 */
function createShader (gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;

    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

/**
 * Create a WebGL2 program
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 */
function createProgram (gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;

    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

/**
 * Create a WebGL2 program
 * @param {WebGL2RenderingContext} gl
 * @param {String} vertexId
 * @param {String} fragmentId
 */
function createProgramFromScripts (gl, vertexId, fragmentId) {
    const vsSource = document.getElementById(vertexId).text.trim();
    const fsSource = document.getElementById(fragmentId).text.trim();
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    return createProgram(gl, vertexShader, fragmentShader);
}

/**
 * Find the attributes used in a shader program
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {String} source
 * @param {Object} target
 */
function scrapeAttributesFromSource (gl, program, source, target) {
    const lines = source.split("\n");
    const n = lines.length;
    for (let i = 0; i < n; i ++) {
        const line = lines[i].trim().split(";")[0];
        let words = line.split(" ");
        if (words[0] === "in" && words.length === 3) {
            let type = words[1];
            let name = words[2];
            target[name] = {
                type: type,
                location: gl.getAttribLocation(program, name)
            };
        }
    }
}

/**
 * Find the attributes used in a shader program
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLProgram} program
 * @param {String} source
 * @param {Object} target
 */
function scrapeUniformsFromSource (gl, program, source, target) {
    const lines = source.split("\n");
    const n = lines.length;
    for (let i = 0; i < n; i ++) {
        const line = lines[i].trim().split(";")[0];
        let words = line.split(" ");
        if (words[0] === "uniform" && words.length === 3) {
            let type = words[1];
            let name = words[2];
            target[name] = {
                type: type,
                location: gl.getUniformLocation(program, name)
            };
        }
    }
}

/**
 * Create an object containing the WebGL2 program as well as attribute and uniform locations
 * @param {WebGL2RenderingContext} gl
 * @param {String} vertexId
 * @param {String} fragmentId
 */
function createProgramObject (gl, vertexId, fragmentId) {
    const vsSource = document.getElementById(vertexId).text.trim();
    const fsSource = document.getElementById(fragmentId).text.trim();
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    let attribLocations = {};
    let uniformLocations = {};

    scrapeUniformsFromSource(gl, program, vsSource, uniformLocations);
    scrapeUniformsFromSource(gl, program, fsSource, uniformLocations);
    scrapeAttributesFromSource(gl, program, vsSource, attribLocations);

    return {
        program: program,
        uniformLocations: uniformLocations,
        attribLocations: attribLocations,
        enableAttributes () {
            for (let attrib in this.attribLocations) {
                gl.enableVertexAttribArray(this.attribLocations[attrib].location);
            }
        },
        disableAttributes () {
            for (let attrib in this.attribLocations) {
                gl.disableVertexAttribArray(this.attribLocations[attrib].location);
            }
        },
    };
}

/**
 * Return a canvas object
 * @param {String} id
 * @param {Number} width
 * @param {Number} height
 * @returns {HTMLCanvasElement}
 */
function getCanvas (id, width, height) {
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = document.getElementById(id);
    canvas.width = width;
    canvas.height = height;
    return canvas;
}