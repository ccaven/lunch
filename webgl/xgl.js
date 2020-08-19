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
		if(type[0] === "1") {
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
  
	XGL = {};
	XGL.Program = Program;
	XGL.loadGL = loadGL;	
}) ();
