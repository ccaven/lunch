const XGL = {};

XGL.typesToSize = {
    "float": 1,
    "vec2": 2,
    "vec3": 3,
    "vec4": 4
};

class Program {
    /**
     * @constructor
     * @param {WebGL2RenderingContext} gl
     * @param {string} vertexId
     * @param {string} fragmentId
    */
    constructor (gl, vertexId, fragmentId) {
        this.gl = gl;

        const vsSource = document.getElementById(vertexId).text.trim();
        const fsSource = document.getElementById(fragmentId).text.trim();

        this.vertexShader = gl.createShader();
        gl.shaderSource(this.vertexShader, vsSource);
        gl.compileShader(this.vertexShader);

        this.fragmentShader = gl.createShader();
        gl.shaderSource(this.fragmentShader, fsSource);
        gl.compileShader(this.fragmentShader);

        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.uniformLocations = {};
        this.attribLocations = {};

        let vsLines = vsSource.split("\n");
        let fsLines = fsSource.split("\n");
        let lines = vsLines.concat(fsLines);
        for (let i = 0; i < lines.length; i ++) {
            let line = lines[i].trim();
            if (line.includes("uniform")) {
                let type = line.split(" ")[1];
                let name = line.split(" ")[2].split(";")[0];
                this.uniformLocations[name] = {
                    loc: this.gl.getUniformLocation(this.program, name),
                    type: type
                };
            }
            else if (line.includes("attribute")) {
                let type = line.split(" ")[1];
                let name = line.split(" ")[2].split(";")[0];
                this.attribLocations[name] = {
                    loc: this.gl.getAttribLocation(this.program, name),
                    type: type
                };
            }
        }
    }

    enableAttributes () {
        for (let attrib in this.attribLocations) {
            this.gl.enableVertexAttribArray(this.attribLocations[attrib].loc);
        }
    }
}