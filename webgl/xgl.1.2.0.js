var XGL;

(function () {
	
	var author = "xacer";
	
	var PHI = (1 + Math.sqrt(5)) / 2;
	
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
	
	var min = function (a, b) {
		return a > b ? b : a;
	};
	
	var max = function (a, b) {
		return a < b ? b : a;
	};
	
	var normalizeVertex = function (v) {
		var s = 1 / Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
		return [v[0] * s, v[1] * s, v[2] * s];
	};
	
	var lerp = function (a, b, k) {
		return k * (b + a) + a;
	};
	
	var lerpVertex = function (a, b, k) {
		return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
	};
	
	var findMidpoint = function (p1, p2, mpCache, verts) {
		var si = min(p1, p2);
		var mi = max(p1, p2);
		var key = si + "-" + mi;
		if (mpCache[key]) {
			return mpCache[key];
		}

		var v1 = verts[p1];
		var v2 = verts[p2];
		var md = lerpVertex(v1, v2, 0.5);

		verts.push(normalizeVertex(md[0], md[1], md[2]));

		var index = verts.length - 1;

		mpCache[key] = index;

		return index;
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

	class Program {
		constructor(vsSource, fsSource) {
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

			gl.useProgram(this.program);
		}
		addAttribLocation(name, id) {
			this.attribLocations[name] = gl.getAttribLocation(this.program, id);
		}
		addUniformLocation(name, id) {
			this.uniformLocations[name] = gl.getUniformLocation(this.program, id);
		}
		addArrayBuffer(name, data) {
			var buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
			this.buffers[name] = buffer;
		}
		addIndexBuffer(name, data) {
			var buffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
			this.buffers[name] = buffer;
		}
		enableVertexAttrib(bufferName, attribName, numComponents, type, normalize, stride, offset) {
			type = type || XGL.gl.FLOAT;
			normalize = normalize || false;
			stride = stride || 0;
			offset = offset || 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[bufferName]);
			gl.vertexAttribPointer(this.attribLocations[attribName], numComponents, type, normalize, stride, offset);
			gl.enableVertexAttribArray(this.attribLocations[attribName]);
		}
		enableElementBuffer(bufferName) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers[bufferName]);
		}
		setUniform(uniformName, type, o1, o2, o3, o4) {
			var loc = this.uniformLocations[uniformName];
			if (type[type.length - 1] === "f") {
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
		setUniformMatrix(uniformName, type, data) {
			gl["uniformMatrix" + type](this.uniformLocations[uniformName], false, data);
		}
		display(vertexCount, type, offset) {
			gl.useProgram(this.program);
			offset = offset || 0;
			type = type || gl.UNSIGNED_SHORT;
			gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
		}
		clearScreen(r, g, b) {
			gl.clearColor(r, g, b, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
		}
		clearDepth() {
			gl.clearDepth(1.0);
			gl.clear(gl.DEPTH_BUFFER_BIT);
		}
		enableDepthTest() {
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
		}
		injectTexture2D(uniformName, n, textureObject) {
			gl.activeTexture(gl.TEXTURE0 + n);
			var tex = gl.createTexture();
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, textureObject.width, textureObject.height, 0, gl.RGB, gl.UNSIGNED_BYTE, textureObject.data);
			this.setUniform(uniformName, "1i", n);
		}
	}

	
	class WorldEditor {
		constructor() {
			this.nodes = [];
			this.elements = [];
			this.colors = [];
		}
		addQuad(x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, r, g, b) {
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
		}
		addTri(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, b) {
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
		}
		addBox(x, y, z, w, h, d, faceColors) {
			this.addQuad(
				x - w / 2, y - h / 2, z - d / 2,
				x - w / 2, y - h / 2, z + d / 2,
				x - w / 2, y + h / 2, z + d / 2,
				x - w / 2, y + h / 2, z - d / 2,
				faceColors[0][0], faceColors[0][1], faceColors[0][2]);
			this.addQuad(
				x + w / 2, y - h / 2, z - d / 2,
				x + w / 2, y - h / 2, z + d / 2,
				x + w / 2, y + h / 2, z + d / 2,
				x + w / 2, y + h / 2, z - d / 2,
				faceColors[1][0], faceColors[1][1], faceColors[1][2]);
			this.addQuad(
				x - w / 2, y - h / 2, z - d / 2,
				x - w / 2, y - h / 2, z + d / 2,
				x + w / 2, y - h / 2, z + d / 2,
				x + w / 2, y - h / 2, z - d / 2,
				faceColors[2][0], faceColors[2][1], faceColors[2][2]);
			this.addQuad(
				x - w / 2, y + h / 2, z - d / 2,
				x - w / 2, y + h / 2, z + d / 2,
				x + w / 2, y + h / 2, z + d / 2,
				x + w / 2, y + h / 2, z - d / 2,
				faceColors[3][0], faceColors[3][1], faceColors[3][2]);
			this.addQuad(
				x - w / 2, y - h / 2, z - d / 2,
				x + w / 2, y - h / 2, z - d / 2,
				x + w / 2, y + h / 2, z - d / 2,
				x - w / 2, y + h / 2, z - d / 2,
				faceColors[4][0], faceColors[4][1], faceColors[4][2]);
			this.addQuad(
				x - w / 2, y - h / 2, z + d / 2,
				x + w / 2, y - h / 2, z + d / 2,
				x + w / 2, y + h / 2, z + d / 2,
				x - w / 2, y + h / 2, z + d / 2,
				faceColors[5][0], faceColors[5][1], faceColors[5][2]);
		}
		addIsosphere(x, y, z, radius, nDivisions, colorFunc, specialFunc) {
			var verts = [
				normalizeVertex(-1, PHI, 0),
				normalizeVertex(1, PHI, 0),
				normalizeVertex(-1, -PHI, 0),
				normalizeVertex(1, -PHI, 0),
				normalizeVertex(0, -1, PHI),
				normalizeVertex(0, 1, PHI),
				normalizeVertex(0, -1, -PHI),
				normalizeVertex(0, 1, -PHI),
				normalizeVertex(PHI, 0, -1),
				normalizeVertex(PHI, 0, 1),
				normalizeVertex(-PHI, 0, -1),
				normalizeVertex(-PHI, 0, 1),
			];
			var faces = [[0, 11, 5],
			[0, 5, 1],
			[0, 1, 7],
			[0, 7, 10],
			[0, 10, 11],
			[1, 5, 9],
			[5, 11, 4],
			[11, 10, 2],
			[10, 7, 6],
			[7, 1, 8],
			[3, 9, 4],
			[3, 4, 2],
			[3, 2, 6],
			[3, 6, 8],
			[3, 8, 9],
			[4, 9, 5],
			[2, 4, 11],
			[6, 2, 10],
			[8, 6, 7],
			[9, 8, 1]];

			var mpCache = {};

			for (var i = 0; i < nDivisions; i++) {
				var newFaces = [];
				for (var j = 0; j < faces.length; j++) {
					var tri = faces[j];
					var v1 = findMidpoint(tri[0], tri[1], mpCache, verts);
					var v2 = findMidpoint(tri[1], tri[2], mpCache, verts);
					var v3 = findMidpoint(tri[2], tri[0], mpCache, verts);

					newFaces.push([tri[0], v1, v3]);
					newFaces.push([tri[1], v2, v1]);
					newFaces.push([tri[2], v3, v2]);
					newFaces.push([v1, v2, v3]);
				}
				faces.length = 0;
				faces = newFaces;
			}

			var colors = [];

			for (var i = 0; i < verts.length; i++) {
				var col = colorFunc(verts[i]);
				colors = colors.concat(col);

				if (specialFunc) {
					verts[i] = specialFunc(verts[i]);
				}

				verts[i][0] = verts[i][0] * radius + x;
				verts[i][1] = verts[i][1] * radius + y;
				verts[i][2] = verts[i][2] * radius + z;
			}

			var i0 = this.nodes.length - 1;

			this.nodes = this.nodes.concat(verts);
			this.colors = this.colors.concat(colors);

			for (var i = 0; i < faces.length; i++) {
				var tri = faces[i];
				this.elements.push(tri[0] + i0);
				this.elements.push(tri[1] + i0);
				this.elements.push(tri[2] + i0);
			}
		}
		loadDataIntoProgram(shaderProgram, vBuffer, cBuffer, eBuffer) {
			shaderProgram.addArrayBuffer(cBuffer, this.colors);
			shaderProgram.addArrayBuffer(vBuffer, this.nodes);
			shaderProgram.addIndexBuffer(eBuffer, this.elements);
		}
	}
	
	
	
	
	
  
	XGL = {};
	XGL.Program = Program;
	XGL.ShapeEditor = WorldEditor;
	XGL.loadGL = loadGL;	
}) ();
