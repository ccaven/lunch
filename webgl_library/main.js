/**
 * @fileoverview xgl - WebGL 3D library
 * @author xacer
 * @version 1.0.0
 */

(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
typeof define === 'function' && define.amd ? define(['exports'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.xgl = {}));
}(this, (function (exports) {

    /** @type {WebGL2RenderingContext} */
    var gl;

    'use strict';

    function createShader (gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) return shader;

        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    function createProgram (gl, vs, fs) {

        const vsSource = document.getElementById(vs).text.trim();
        const fsSource = document.getElementById(fs).text.trim();

        const vShader = createShader(gl, gl.VERTEX_SHADER, vsSource);

        const fShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);

        gl.linkProgram(program);

        return program;
    }

    function scrapeIn (source, out) {
        source.split("\n").forEach(line => {
            let words = line.trim().replace(";", "").split(" ");
            if (words[0] === "in") {
                let name = words[2];
                out.locations[name] = gl.getAttribLocation(out.program, name);
                out.types[name] = words[1];
            }
        });
    }

    function scrapeUniform (source, out) {
        source.split("\n").forEach(line => {
            let words = line.trim().replace(";", "").split(" ");
            if (words[0] === "uniform") {
                let name = words[2];
                out.locations[name] = gl.getUniformLocation(out.program, name);
                out.types[name] = words[1];
            }
        });
    }

    class Renderer {

        static typeToKeyword = {
            float: "1f",
			vec2: "2f",
			vec3: "3f",
			vec4: "4f",

			int: "1i",
			ivec2: "2i",
			ivec3: "3i",
			ivec4: "4i",

			mat2: "Matrix2f",
			mat3: "Matrix3f",
			mat4: "Matrix4f",

			sampler2D: "1i"
        };

        constructor (name) {
            this.program = createProgram(gl, name + ".vsh", name + ".fsh");

            this.locations = {};
            this.types = {};

            let vsSource = document.getElementById(name + ".vsh").text.trim();
            let fsSource = document.getElementById(name + ".fsh").text.trim();

            scrapeIn(vsSource, this);
            scrapeUniform(vsSource, this);
            scrapeUniform(fsSource, this);
        }

        setUniform (name, ...values) {
            let type = this.types[name];
            let loc = this.locations[name];

            gl.useProgram(this.program);

            if (values.length > 1)	gl["uniform" + Renderer.typeToKeyword[type]](loc, ...values);
            else if (typeof values[0] === "number") gl["uniform" + Renderer.typeToKeyword[type]](loc, ...values);
            else {
                let b = Renderer.typeToKeyword[type];
                if (type[0] === "m") gl["uniform" + Renderer.typeToKeyword[type] + "v"](loc, false, values[0]);
                else gl["uniform" + Renderer.typeToKeyword[type] + "v"](loc, values[0]);
            }
        }
    }

    class Mesh {
        constructor (...buffers) {
            this.vertexArray = gl.createVertexArray();
            this.buffers = {};
            this.sizes = {};
            this.data = {};
            for (let i = 0; i < buffers.length; i += 2) {
                let name = buffers[i];
                let size = buffers[i+1];
                this.buffers[name] = gl.createBuffer();
                this.sizes[name] = size;
                this.data[name] = null;
            }
            this.triangleBuffer = gl.createBuffer();
        }

        setData (name, data) {
            this.data[name] = data;
        }

        setBuffers (mode=gl.STATIC_DRAW) {
            gl.bindVertexArray(this.vertexArray);
            for (let name in this.buffers) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name]);
                gl.bufferData(gl.ARRAY_BUFFER, this.data[name], mode);
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.data.triangles, mode);
        }

        setAttribPointers (renderer) {
            gl.bindVertexArray(this.vertexArray);
            gl.useProgram(renderer.program);
            for (let name in this.buffers) {
                let attribName = "a_" + name;
                let attribLoc = renderer.locations[attribName];
                gl.enableVertexAttribArray(attribLoc);
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name]);
                gl.vertexAttribPointer(attribLoc, this.sizes[name], gl.FLOAT, false, 0, 0);
            }
        }

        render (renderer) {
            gl.bindVertexArray(this.vertexArray);
            gl.useProgram(renderer.program);
            gl.drawElements(gl.TRIANGLES, this.data.triangles.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    class PixelRenderer extends Renderer{
        static screenPositions = [-1, -1, 1, -1, 1, 1, -1, 1];
        static screenTris = [0, 1, 2, 0, 2, 3];

        constructor (name) {
            super(...arguments);

            this.mesh = new Mesh("position", 2);
            this.mesh.setData("position", new Float32Array(screenPositions));
            this.mesh.setData("triangles", new Uint16Array(screenTris));
            this.mesh.setBuffers();
            this.mesh.setAttribPointers(this);
        }

        render () {
            this.mesh.render(this);
        }
    }

    class RenderTexture {
        constructor (width, height) {
            this.width = width;
            this.height = height;

            this.colorTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            this.framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
        }

        setRenderTarget () {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        }
    }

    exports.Renderer = Renderer;
    exports.Mesh = Mesh;
    exports.PixelRenderer = PixelRenderer;
    exports.RenderTexture = RenderTexture;

    Object.defineProperty(exports, '__esModule', { value: true });

})));