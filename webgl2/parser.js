
function parseMtl (output, lines) {
  const materials = {};
  
  let material;
  
  const keywords = {
    newmtl (parts, unparsedArgs) {
      material = {};
      materials[unparsedArgs] = material;
    },    
    Kd(parts) { 
      material.diffuse = parts.map(parseFloat); 
    },
  };
  
  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);
      continue;
    }
    handler(parts, unparsedArgs);
  }
 
  return materials;
}

function parseObj (output, lines) {  
  // Retrieve existing data
  const objVertexData = output.objVertexData;
  const webglVertexData = output.webglVertexData;
  
  const positions = objVertexData[0];
  const texcoords = objVertexData[1];
  const normals = objVertexData[2];
  const colors = objVertexData[3];
  
  let curMaterial = objVertexData.curMaterial;
  
  // Code to add new data
  function addVertex (vert) {
    const ptn = vert.split("/");
    ptn.forEach((str, i) => {
        if (!str) return;
        const objIndex = parseInt(str);
        const index = objIndex + (objIndex >= 0 ? 0 : objVertexData.length);
        webglVertexData[i].push(...objVertexData[i][index]);
    })
    // Add color 3 times
    webglVertexData[3].push(...curMaterial.diffuse, ...curMaterial.diffuse, ...curMaterial.diffuse);
  }
  const keywords = {
    v(parts) {
      positions.push(parts.map(parseFloat));
    },
    vn(parts) {
      normals.push(parts.map(parseFloat));
    },
    vt(parts) {
      texcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      const n = parts.length - 2;
      for (let i = 0; i < n; i ++) {
          addVertex(parts[0]);
          addVertex(parts[i+1]);
          addVertex(parts[i+2]);
      }
    },
    usemtl(parts) {
      curMaterial = objVertexData.materials(parts[0]);
    }
  };
  
  const re = /(\w*)(?: )*(.*)/;
  const numLines = lines.length;
  for (let i = 0; i < numLines; i ++) {
    const line = lines[i].trim();
    
    if (!line.length || line[0] === "#") continue;

    let parts = line.split(/\s+/);

    const m = re.exec(line);

    if (!m) continue;

    const [, keyword, unparsedArgs] = m;

    parts = line.split(/\s+/).slice(1);

    const handler = keywords[keyword];
    if (!handler) {
        console.warn("Unhandled keyword:", keyword, "at line", i + 1);
        continue;
    }

    handler(parts, unparsedArgs);
  }  
}

function transformIntoMesh (gl, output) {
  const webglVertexData = output.webglVertexData;
  
  const vertices = new Float32Array(webglVertexData[0]);
  const normals = new Float32Array(webglVertexData[2]);
  const colors = new Float32Array(webglVertexData[3]);
  
  const triangles = new Uint16Array(vertices.length / 3).map((e, i) => i);
  
  gl.bindVertexArray(output.vertexArray);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, output.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, output.normalBuffer);
  gl.bufferData(gl.ARRAY_BIFFER, normals, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, output.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, output.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
  
}
