
function createShader(gl, type, source) {
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


var Renderer = (function () {
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

  const typeToKeyword = {
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

  return class {
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

      if (values.length > 1)	gl["uniform" + typeToKeyword[type]](loc, ...values);
      else if (typeof values[0] === "number") {
        gl["uniform" + typeToKeyword[type]](loc, ...values);
      }
      else {
        let b = typeToKeyword[type];
        if (type[0] === "m") gl["uniform" + typeToKeyword[type] + "v"](loc, false, values[0]);
        else gl["uniform" + typeToKeyword[type] + "v"](loc, values[0]);

      }
    }
  };
}) ();

var Mesh = (function () {

  const cubePositions = [
    0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1,
    0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0,
    0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
    0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1,
    1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1,
    0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0,

  ];
  const cubeTexcoords = [
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0,	1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0,	1, 1, 0, 1,
    0, 0, 1, 0, 1, 1, 0, 1,
    0, 0, 1, 0,	1, 1, 0, 1
  ];
  const cubeNormals = [
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,

  ];
  const cubeTris = [
    0,  1,  2,      0,  2,  3,
    4,  5,  6,      4,  6,  7,
    8,  9,  10,     8,  10, 11,
    12, 13, 14,     12, 14, 15,
    16, 17, 18,     16, 18, 19,
    20, 21, 22,     20, 22, 23,
  ];

  return class {
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

    static setRectangle (mesh, dimensions) {
      const positions = new Float32Array(cubePositions);
      for (let i = 0; i < positions.length; i ++) {
        positions[i] -= 0.5;
        positions[i] *= dimensions[i % 3];
      }
      const texcoords = new Float32Array(cubeTexcoords);
      const normals = new Float32Array(cubeNormals);
      const tris = new Uint16Array(cubeTris);

      mesh.setData("position", positions);
      mesh.setData("texcoord", texcoords);
      mesh.setData("normal", normals);
      mesh.setData("triangles", tris);
      mesh.setBuffers();
    }
  };

}) ();
var PixelRenderer = (function () {
  const screenPositions = [-1, -1, 1, -1, 1, 1, -1, 1];
  const screenTris = [0, 1, 2, 0, 2, 3];

  return class extends Renderer {
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

  };
}) ();

var RenderTexture = (function () {
  return class {
    constructor (width, height, useDepthBuffer=false) {
      this.width = width;
      this.height = height;

      this.colorTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      if (useDepthBuffer) {
        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, this.width, this.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      }

      this.framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);

      if (useDepthBuffer) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
      }
    }

    setRenderTarget () {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }
  };

}) ();
