
var XGL;

(function () {

    const universalVertexShader = "attribute vec2 aPosition; void main() { gl_Position = vec4(aPosition.xy, 0.0, 1.0); }";

    function loadShader (gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(source);
        gl.compileShader(shader);
        return shader;
    }

    function loadProgram (gl, fragmentShader, vertexShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }

    class XGL_Program {
        constructor (gl, fsSourceId) {
            this.gl = gl;
            this.vsSource = universalVertexShader;
            this.fsSource = document.getElementById(fsSourceId).text;
            this.vertexShader = loadShader(gl, gl.VERTEX_SHADER, this.vsSource);
            this.fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, this.fsSource);
            this.program = loadProgram(gl, this.vertexShader, this.fragmentShader);
            this.uniformLocations = {};

            this.width = this.gl.drawingBufferWidth;
            this.height = this.gl.drawingBufferHeight;
        }
        
        addUniformLocation (id) {
            this.uniformLocations[id] = this.gl.getUniformLocation(this.program, id);
        }

        setUniform(uniformName, type, o1, o2, o3, o4) {
            var loc = this.uniformLocations[uniformName];
            if (type[type.length - 1] === "v") {
                gl["uniform" + type](loc, o1);
            } else if (type[0] === "1") {
                gl["uniform" + type](loc, o1);
            } else if (type[0] === "2") {
                gl["uniform" + type](loc, o1, o2);
            } else if (type[0] === "3") {
                gl["uniform" + type](loc, o1, o2, o3);
            } else {
                gl["uniform" + type](loc, o1, o2, o3, o4);
            }
        }



        initialize() {
            this.gl.viewport(0, 0, this.width, this.height);

            var triBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, +1, -1, -1, +1, -1, +1, +1, -1, +1, +1]), gl.STATIC_DRAW);

            var positionLocation = gl.getAttribLocation(this.program, "aPosition");
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
            this.gl.useProgram(this.program);
        }

        display() {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

    XGL = {
        Program: XGL_Program,        
    };
}) ();