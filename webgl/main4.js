var XGL;

(function () {
	
	var author = "xacer";
	
	var version = "1.0.0";
	
	var gl, canvas;
	
	var loadGL = function(c) {
		XGL.canvas = c;
		XGL.width = c.width;
		XGL.height = c.height;
		
		XGL.gl = XGL.canvas.getContext("webgl");
		
		gl = XGL.gl;
		canvas = XGL.canvas;
	};

	var loadShader = function(type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		var compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
		if (!compileStatus) {
			gl.deleteShader(shader);
		}

		return shader;
	};

	var Program = function (vsSource, fsSource) {
		this.vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
		this.fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

		this.program = gl.createProgram();
		gl.attachShader(this.program, this.vertexShader);
		gl.attachShader(this.program, this.fragmentShader);
		gl.linkProgram(this.program);

		var linkStatus = gl.getProgramParameter(this.program, gl.LINK_STATUS);
		if (!linkStatus) {
		}

		this.attribLocations = {};
		this.uniformLocations = {};
		this.buffers = {};
	};

	Program.prototype.addAttribLocation = function(name, id) {
		this.attribLocations[name] = gl.getAttribLocation(this.program, id);
	};

	Program.prototype.addUniformLocation = function(name, id) {
		this.uniformLocations[name] = gl.getUniformLocation(this.program, id);
	};

	Program.prototype.addArrayBuffer = function(name, data) {
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		this.buffers[name] = buffer;
	};

	Program.prototype.addIndexBuffer = function(name, data) {
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
		this.buffers[name] = buffer;
	};
	XGL = {};
	XGL.Program = Program;
	XGL.loadGL = loadGL;	
}) ();
