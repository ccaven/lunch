
var XSHADER;

(function () {

  var gl;
  
  var loadGL = function (c) {
    gl = c.getContext("webgl");
    XSHADER.gl = gl;
    XSHADER.canvas = gl.canvas;
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
  
  var Shader = function (fsSource) {
    this.vsSource = "attribute vec2 a_position;void main() { gl_Position = vec4(a_position.xy, 0.0, 1.0); }";
		this.fsSource = fsSource;
    
    this.vertexShader = loadShader(gl.VERTEX_SHADER, this.vsSource);
    this.fragmentShader = loadShader(gl.FRAGMENT_SHADER, this.fsSource);
    
    this.program = gl.createProgram();
    
    gl.attachShader(this.program, this.vertexShader);
		gl.attachShader(this.program, this.fragmentShader);
		gl.linkProgram(this.program);
    
    this.uniformLocations = {};
  };
  
  Shader.prototype.setUniform = function (uniformName, type, o1, o2, o3, o4) {
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
  
  Shader.prototype.addUniformLocation = function (name, id) {
    this.uniformLocations[name] = gl.getUniformLocation(this.program, id);
  };
  
  Shader.prototype.injectTexture2D = function (uniformName, n, textureObject) {
		gl.activeTexture(gl.TEXTURE0 + n);
		var tex = gl.createTexture();
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, textureObject.width, textureObject.height, 0, gl.RGB, gl.UNSIGNED_BYTE, textureObject.data);
		this.setUniform(uniformName, "1i", n);
	};
  
  Shader.prototype.initialize = function () {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    var triBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, +1, -1, -1, +1, -1, +1, +1, -1, +1, +1]), gl.STATIC_DRAW);

    var positionLocation = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  };
  
  Shader.prototype.display = function (deltaTime) {
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  XSHADER = {};
  XSHADER.Shader = Shader;
  XSHADER.loadGL = loadGL;
}) ();
