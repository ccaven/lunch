var XGL;

(function () {
	
	var author = "xacer";
	
	var version = "1.0.0";
	
	var gl, canvas;
	
	var loadGL = function(c) {
		XGL.canvas = c;
		XGL.width = c.width;
		XGL.height = c.height;
    
		var glArgs = {
			preserveDrawingBuffer: true,
			failIfMajorPerformanceCaveat: true
		};
		
		XGL.gl = XGL.canvas.getContext("webgl", glArgs);
		
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
	
	Program.prototype.enableVertexAttrib = function (bufferName, attribName, numComponents, type, normalize, stride, offset) {
		type = type || XGL.gl.FLOAT;
		normalize = normalize || false;
		stride = stride || 0;
		offset = offset || 0;		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[bufferName]);
		gl.vertexAttribPointer(this.attribLocations[attribName], numComponents, type, normalize, stride, offset);
		gl.enableVertexAttribArray(this.attribLocations[attribName]);
	};
	
	Program.prototype.enableElementBuffer = function (bufferName) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers[bufferName]);
	};
	
	Program.prototype.setUniform = function (uniformName, type, o1, o2, o3, o4) {
		var loc = this.uniformLocations[uniformName];
		if(type[type.length-1] === "f") {
			gl["uniform" + type](loc, o1);
		} else if(type[0] === "1") {
			gl["uniform" + type](loc, o1);
		} else if (type[0] === "2") {
			gl["uniform" + type](loc, o1, o2);
		} else if (type[0] === "3") {
			gl["uniform" + type](loc, o1, o2, o3);
		} else {
			gl["uniform" + type](loc, o1, o2, o3, o4);
		}
	};
	
	Program.prototype.setUniformMatrix = function (uniformName, type, data) {
		gl["uniformMatrix" + type](this.uniformLocations[uniformName], false, data);
	};
	
	Program.prototype.display = function (vertexCount, type, offset) {
		gl.useProgram(this.program);
		offset = offset || 0;
		type = type || gl.UNSIGNED_SHORT;
		gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
	};
  
	Program.prototype.clearScreen = function (r, g, b) {
		gl.clearColor(r, g, b, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
	};

	Program.prototype.clearDepth = function () {
		gl.clearDepth(1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT);
	};

	Program.prototype.enableDepthTest = function () {
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
	};

	Program.prototype.injectTexture2D = function (uniformName, n, textureObject) {
		gl.activeTexture(gl.TEXTURE0 + n);
		var tex = gl.createTexture();
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, textureObject.width, textureObject.height, 0, gl.RGB, gl.UNSIGNED_BYTE, textureObject.data);
		this.setUniform(uniformName, "1i", n);
	};
	
	var WorldEditor = function () {
		this.nodes = [];
		this.elements = [];
		this.colors = [];
	};
	
	WorldEditor.prototype.addQuad = function(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, r, g, b) {
		var index0 = this.nodes.length / 3.0;
		
		var newNodes = [
			x1, y1, z1,
			x2, y2, z2,
			x3, y3, z3,
			x4, y4, z4
		];
		
		var newColors = [
			r, g, b, 1.0,
			r, g, b, 1.0,
			r, g, b, 1.0,
			r, g, b, 1.0
		];
		
		var newIndex = [
			index0 + 0, index0 + 1, index0 + 2,
			index0 + 0, index0 + 2, index0 + 3
		];
		
		this.nodes = this.nodes.concat(newNodes);
		this.elements = this.elements.concat(newIndex);
		this.colors = this.colors.concat(newColors);
	};
	
	WorldEditor.prototype.addTri = function(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, b) {
		var index0 = this.nodes.length / 3.0;
		
		var newNodes = [
			x1, y1, z1,
			x2, y2, z2,
			x3, y3, z3
		];
		
		var newColors = [
			r, g, b,
			r, g, b,
			r, g, b
		];
		
		var newIndex = [
			index0 + 0, index0 + 1, index0 + 2
		];
		
		this.nodes = this.nodes.concat(newNodes);
		this.elements = this.elements.concat(newIndex);
		this.colors = this.colors.concat(newColors);
	};
	
	WorldEditor.prototype.addBox = function(x, y, z, w, h, d, faceColors) {
		this.addQuad(
			x - w/2, y - h/2, z - d/2,
			x - w/2, y - h/2, z + d/2,
			x - w/2, y + h/2, z + d/2,
			x - w/2, y + h/2, z - d/2, 
			faceColors[0][0], faceColors[0][1], faceColors[0][2]);
		this.addQuad(
			x + w/2, y - h/2, z - d/2,
			x + w/2, y - h/2, z + d/2,
			x + w/2, y + h/2, z + d/2,
			x + w/2, y + h/2, z - d/2, 
			faceColors[1][0], faceColors[1][1], faceColors[1][2]);
		this.addQuad(
			x - w/2, y - h/2, z - d/2,
			x - w/2, y - h/2, z + d/2,
			x + w/2, y - h/2, z + d/2,
			x + w/2, y - h/2, z - d/2, 
			faceColors[2][0], faceColors[2][1], faceColors[2][2]);
		this.addQuad(
			x - w/2, y + h/2, z - d/2,
			x - w/2, y + h/2, z + d/2,
			x + w/2, y + h/2, z + d/2,
			x + w/2, y + h/2, z - d/2, 
			faceColors[3][0], faceColors[3][1], faceColors[3][2]);
		this.addQuad(
			x - w/2, y - h/2, z - d/2,
			x + w/2, y - h/2, z - d/2,
			x + w/2, y + h/2, z - d/2,
			x - w/2, y + h/2, z - d/2, 
			faceColors[4][0], faceColors[4][1], faceColors[4][2]);
		this.addQuad(
			x - w/2, y - h/2, z + d/2,
			x + w/2, y - h/2, z + d/2,
			x + w/2, y + h/2, z + d/2,
			x - w/2, y + h/2, z + d/2, 
			faceColors[5][0], faceColors[5][1], faceColors[5][2]);
	};
	
	WorldEditor.prototype.loadDataIntoProgram = function (shaderProgram, vBuffer, cBuffer, eBuffer) {
		shaderProgram.addArrayBuffer(cBuffer, this.colors);
		shaderProgram.addArrayBuffer(vBuffer, this.nodes);
		shaderProgram.addIndexBuffer(eBuffer, this.elements);
	};
  
	XGL = {};
	XGL.Program = Program;
	XGL.ShapeEditor = WorldEditor;
	XGL.loadGL = loadGL;	
}) ();
