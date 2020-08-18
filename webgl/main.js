
var gl, canvas;

var loadShader = function(type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	
	var compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (!compileStatus) {
		console.log("Shader not compiled... deleting");
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
		console.log("Program not linked properly");
	}
	
	this.attribLocations = {};
	this.uniformLocations = {};
	this.buffers = {};
};

Program.prototype.addAttribLocation(name, id) {
	this.attribLocations[name] = gl.getAttribLocation(this.program, id);
};

Program.prototype.addUniformLocation(name, id) {
	this.uniformLocations[name] = gl.getUniformLocation(this.program, id);
};

Program.prototype.addArrayBuffer(name, data) {
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
	this.buffers[name] = buffer;
};

Program.prototype.addIndexBuffer(name, data) {
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new UInt16Array(data), gl.STATIC_DRAW);
	this.buffers[name] = buffer;
};


