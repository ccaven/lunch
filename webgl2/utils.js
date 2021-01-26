// https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj.html
function parseObj (txt) {

    const positions = [[0, 0, 0]];
    const texcoords = [[0, 0]];
    const normals = [[0, 0, 0]];

    const objVertexData = [
        positions,
        texcoords,
        normals
    ];

    const webglVertexData = [
        [],
        [],
        []
    ];

    function addVertex (vert) {
        const ptn = vert.split("/");
        ptn.forEach((str, i) => {
            if (!str) return;
            const objIndex = parseInt(str);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData.length);
            webglVertexData[i].push(...objVertexData[i][index]);
        })
    }

    const keywords = {
        v(parts) {
            positions.push(parts.map(parseFloat));
        },
        vn(parts) {
            normals.push(parts.map(parseFloat));
        },
        vt(parts) {
            texcoords.push(parts.map(parseFloat));
        },
        f(parts) {
            const n = parts.length - 2;
            for (let i = 0; i < n; i ++) {
                addVertex(parts[0]);
                addVertex(parts[i+1]);
                addVertex(parts[i+2]);
            }
        },
    };

    const re = /(\w*)(?: )*(.*)/;

    const lines = txt.split("\n");

    for (let i = 0; i < lines.length; i ++) {
        const line = lines[i].trim();

        if (!line.length || line[0] === "#") continue;

        let parts = line.split(/\s+/);

        const m = re.exec(line);

        if (!m) continue;

        const [, keyword, unparsedArgs] = m;

        parts = line.split(/\s+/).slice(1);

        const handler = keywords[keyword];
        if (!handler) {
            console.warn("Unhandled keyword:", keyword, "at line", i + 1);
            continue;
        }

        handler(parts, unparsedArgs);
    }

    let mesh = new Mesh();
    mesh.setVertices(new Float32Array(webglVertexData[0]));
    mesh.setTriangles(Mesh.AUTOMATIC);
    mesh.setNormals(new Float32Array(webglVertexData[2]));
    return mesh;
}


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

    canvas.style.position = "fixed";
    canvas.style.top = "0px";
    canvas.style.left = "0px";

    return canvas;
}


