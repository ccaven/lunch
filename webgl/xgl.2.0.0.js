export var XGL = {};

(function () {

    /* 3D Vector library */
    const vec3 = {
        /* Create a new vector */
        new: function (x, y, z) {
            return [x, y, z];
        },
        
        /* Create a new vector based on a quaternion */
        fromQuaternion: function (q) {
            return [q[1], q[2], q[3]];
        },
        
        /* Add two vectors */
        add: function (u, v) {
            return [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
        },
        
        /* Subtract two vectors */
        sub: function (u, v) {
            return [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
        },
        
        /* Scale vector u by scale f */
        scl: function (u, f) {
            return [u[0] * f, u[1] * f, u[2] * f];
        },
        
        /* Cross product between two vectors */
        cross: function (u, v) {
            return [
                u[1] * v[2] - v[1] * u[2],
                u[2] * v[0] - v[2] * u[0],
                u[0] * v[1] - v[0] * u[1]
            ];
        },
        
        /* Average point in a face */
        center: function (a, b, c, d) {
            return [
                (a[0] + b[0] + c[0] + d[0]) / 4,
                (a[1] + b[1] + c[1] + d[1]) / 4,
                (a[2] + b[2] + c[2] + d[2]) / 4,
            ];
            
        },
        
        /* Square magnitude of a vector */
        dot2: function (u) {
            return u[0] * u[0] + u[1] * u[1] + u[2] * u[2];
        },
        
        /* Orthogontal projection */
        ortho: function (v) {
            return [v[0] * 300 + 300, v[1] * 300 + 300];
        },
        
        /* Magnitude of a vector */
        mag: function (v) {
            return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        },
        
        /* Normalize a vector */
        normalize: function (v) {
            let s = 1 / Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
            return [v[0] * s, v[1] * s, v[2] * s];
        },

        x: [1, 0, 0],
        y: [0, 1, 0],
        z: [0, 0, 1]
    };

    /* Quaternion library */
    const quat = {
        /* Create a new quaternion */
        fromCoordinates: function (r=1, i=0, j=0, k=0) {
            /* Real + 3 imagninary components */
            return [r, i, j, k];
        },
        
        /* Create a quaternion based on axis and theta */
        fromAngle: function (axis, theta) {
            axis = vec3.normalize(axis);
            let st = Math.sin(theta / 2);
            return this.normalize([
                Math.cos(theta / 2),
                axis[0] * st,
                axis[1] * st,
                axis[2] * st
            ]);
        },
        
        /* Create a quaternion from a vector */
        fromVector: function (v) {
            return [0, v[0], v[1], v[2]];
        },
        
        /* Get axis and theta of quaternion */
        getAngle: function (q) {
            /* Retrieve information */
            let r = q[0], i = q[1], j = q[2], k = q[3];
            let m = Math.sqrt(i * i + j * j + k * k);
            return {
                axis: vec3.scl([i, j, k], 1 / m),
                theta: 2 * Math.atan2(m, r)
            };
        },
        
        /* Get conjugate quaternion */
        conjugate: function (q) {
            let r = q[0], i = q[1], j = q[2], k = q[3];
            let m = r * r + i * i + j * j + k * k;
            return [r / m, -i / m, -j / m, -k / m];
        },
        
        /* Create a quaternion based on a rotation matrix */
        fromMatrix: function (m) {
            // 0 = Rt(R - I)u + (R - I)u
            //   = (RtR - Rt + R - I)u
            //   = (I - Rt + R - I)u
            //   = (R - Rt)u
            // [u]x = (R - Rt) = u x u = 0
            
            let axis = [m[7] - m[5], m[2] - m[6], m[3] - m[1]];
            
            // |u| = 2 sin theta
            let theta = Math.asin(vec3.mag(axis) * 0.5);
            
            if (axis[0] + axis[1] + axis[2] === 0) {
                axis[0] = 1;
            }
            return this.fromAngle(axis, theta);
        },
        
        /* Normalize a quaternion */
        normalize: function (q) {
            let qm = q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
            if (qm === 0) {
                return [1, 0, 0, 0];
            }
            qm = 1 / Math.sqrt(qm);
            return [q[0] / qm, q[1] / qm, q[2] / qm, q[3] / qm];
        },
        
        /* Add two quaternions */
        add: function (a, b) {
            return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
        },
        
        /* Subtract one quaternion from another */
        sub: function (a, b) {
            return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
        },
        
        /* Dot product of two quaternions */
        dot: function (a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
        },
        
        /* Scale a quaternion */
        scl: function (a, f) {
            return [a[0] * f, a[1] * f, a[2] * f, a[3] * f];
        },
        
        /* Spherical interpolation of two quaternions */
        slerp: function (a, b, t) {
            a = this.normalize(a);
            b = this.normalize(b);
            
            let dt = this.dot(a, b);
            if (dt < 0) {
                a = this.scl(a, -1);
                dt *= -1;
            }
            
            let dot_threshold = 0.9995;
            
            /* If it's too close then linearly interp */
            if (dt > dot_threshold) {
                let res = this.lerp(a, b, t);
                return this.normalize(res);
            }
            
            let theta0 = Math.acos(dt);
            let theta = theta0 * t;
            
            let st = Math.sin(theta);
            let st0 = Math.sin(theta0);
            
            let s0 = Math.cos(theta) - dt * st / st0;
            let s1 = st / st0;
            
            return [
                a[0] * s0 + b[0] * s1,
                a[1] * s0 + b[1] * s1,
                a[2] * s0 + b[2] * s1,
                a[3] * s0 + b[3] * s1
            ];
            
        },
        
        /* Linear interpolation of two quaternions */
        lerp: function (a, b, t) {
            /* Only used when two quaternions are very close */
            return [
                a[0] + (b[0] - a[0]) * t,
                a[1] + (b[1] - a[1]) * t,
                a[2] + (b[2] - a[2]) * t,
                a[3] + (b[3] - a[3]) * t,
            ];
        },
        
        /* Multiply two quaternions */
        mul: function (a, b) {
            /* Hamilton product, based on 
            ijk = i^2 = j^2 = k^2 = -1 */
            let a1 = a[0], a2 = b[0],
                b1 = a[1], b2 = b[1],
                c1 = a[2], c2 = b[2],
                d1 = a[3], d2 = b[3];
            return [
                a1 * a2 - b1 * b2 - c1 * c2 - d1 * d2,
                a1 * b2 + b1 * a2 + c1 * d2 - d1 * c2,
                a1 * c2 - b1 * d2 + c1 * a2 + d1 * b2,
                a1 * d2 + b1 * c2 - c1 * b2 + d1 * a2
            ];
        },
        
        /* Transform a point based on a quaternion */
        transform: function (q, v) {
            /* p' = qp(q^-1) */
            let inv = this.conjugate(q);
            let p = this.fromVector(v);
            let res = this.mul(q, this.mul(p, inv));
            return vec3.fromQuaternion(res);
        },
        
        /* Clone a quaternion */
        clone: function (q) {
            return [q[0], q[1], q[2], q[3]];
        },

        /* Create a quaternion from two vectors 
        https://answers.unity.com/questions/467614/what-is-the-source-code-of-quaternionlookrotation.html
        */
        lookRotation: function (f, u) {
            let v = vec3.normalize(f);
            let v2 = vec3.normalize(vec3.cross(u, f));
            let v3 = vec3.cross(v, v2);

            let m00 = v2[0], m01 = v2[1], m02 = v2[2];
            let m10 = v3[0], m11 = v3[1], m12 = v3[2];
            let m20 = v[0], m21 = v[1], m22 = v[2];

            let n8 = m00 + m11 + m22;

            let q = [];

            if (n8 > 0) {
                let num = Math.sqrt(n8 + 1);
                q[3] = num * 0.5;
                num = 0.5 / num;
                q[0] = (m12 - m21) * num;
                q[1] = (m20 - m02) * num;
                q[2] = (m01 - m10) * num;
                return q;
            }

            if ((m00 >= m11) && (m00 >= m22)) {
                let num7 = Math.sqrt(1 + m00 - m11 - m22);
                let num4 = 0.5 / num7;
                q[0] = 0.5 * num7;
                q[1] = (m01 + m10) * num4;
                q[2] = (m02 + m20) * num4;
                q[3] = (m12 - m21) * num4;
                return q;
            }

            if (m11 > m22) {
                let num = Math.sqrt(1 + m22 - m00 - m11);
                q[1] = 0.5 * num;
                num = 0.5 / num;
                q[0] = (m10 + m01) * num;
                q[2] = (m21 - m12) * num;
                q[3] = (m20 - m02) * num;
                return q;
            }
            let num = Math.sqrt(1 + m22 - m00 - m11);
            q[2] = 0.5 * num;
            num = 0.5 / num;
            q[0] = (m20 + m02) * num;
            q[1] = (m21 + m12) * num;
            q[3] = (m01 - m10) * num;
            return q;
        }
    };

    /* Mesh constructor */
    class Mesh {
        constructor () {
            this.vertices = [];
            this.faces = [];
        }

        setVertices (arr) {
            this.vertices.length = 0;
            const l = arr.length;
            if (arr[0].x) {
                for (let i = 0; i < l; i ++) {
                    this.vertices[i*3] = arr[i].x;
                    this.vertices[i*3+1] = arr[i].y;
                    this.vertices[i*3+2] = arr[i].z;
                }
            } else if (arr[0][0]) {
                for (let i = 0; i < l; i ++) {
                    this.vertices[i*3] = arr[i][0];
                    this.vertices[i*3+1] = arr[i][1];
                    this.vertices[i*3+2] = arr[i][2];
                }
            } else {
                for (let i = 0; i < l; i ++) {
                    this.vertices[i] = arr[i];
                }
            }
        }

        setFaces (arr) {
            this.faces.length = 0;
            const l = arr.length;
            for (let i = 0; i < l; i ++) {
                this.faces[i] = arr[i];
            }
        }

        translate (x, y, z) {
            const l = this.vertices.length;
            for (let i = 0; i < l; i += 3) {
                this.vertices[i + 0] += x;
                this.vertices[i + 1] += y;
                this.vertices[i + 2] += z;
            }
        }

        scale (fx, fy, fz) {
            fy = fy || fx;
            fz = fz || fx;

            const l = this.vertices.length;
            for (let i = 0; i < l; i += 3) {
                this.vertices[i + 0] *= fx;
                this.vertices[i + 1] *= fy;
                this.vertices[i + 2] *= fz;
            }
        }

        rotate (q) {
            for (let i = 0; i < l; i += 3) {
                let v = vec3.new(this.vertices[i], this.vertices[i+1], this.vertices[i+2]);
                let vprime = quat.transform(q, v);
                this.vertices[i] = v[0];
                this.vertices[i+1] = v[1];
                this.vertices[i+2] = v[2];
            }
        }

        static constructPlane (width, height) {
            const mesh = new Mesh();

            let vertices = [];
            let faces = [];

            for (let x = 0; x < width; x ++) {
                for (let y = 0; y < height; y ++) {
                    let l = x + y * width;
                    vertices[l * 3 + 0] = x / width;
                    vertices[l * 3 + 1] = y / height;
                    vertices[l * 3 + 2] = 0;
                }
            }

            let faceI = 0;
            for (let x = 0; x < width - 1; x ++) {
                for (let y = 0; y < height - 1; y ++) {
                    let l = x + y * width;
                    faces[faceI ++] = l;
                    faces[faceI ++] = l + 1;
                    faces[faceI ++] = l + width;

                    faces[faceI ++] = l + 1;
                    faces[faceI ++] = l + width;
                    faces[faceI ++] = l + 1 + width;
                }
            }
            
            mesh.setVertices(vertices);
            mesh.setFaces(faces);

            return mesh;
        }
        
        static constructIcosphere (radius, numDivisions) {
            const mesh = new Mesh();

            let PHI = (1 + Math.sqrt(5)) / 2;

            let v = (x, y, z) => {
                let l = radius / Math.sqrt(x * x + y * y + z * z);
                return [x / l, y / l, z / l];
            };

            let vertices = [
                v(-1, PHI, 0),
                v(1, PHI, 0),
                v(-1, -PHI, 0), 
                v( 1, -PHI, 0), 
                v(0, -1, PHI), 
                v(0, 1, PHI), 
                v(0, -1, -PHI), 
                v(0, 1, -PHI),
                v( PHI, 0, -1), 
                v( PHI, 0, 1), 
                v(-PHI, 0, -1), 
                v(-PHI, 0, 1),
            ];

            let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],[4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];

            let mpCache = {};
            let mp = (p1, p2) => {
                let si = Math.min(p1, p2);
                let mi = Math.max(p1, p2);
                let key = si + "-" + mi;
                if (mpCache[key]) return mpCache[key];

                let v1 = vertices[p1];
                let v2 = vertices[p2];
                let md = vec3.lerp(v1, v2, 0.5);

                vertices.push(v(md[0], md[1], md[2]));

                let index = vertices.length - 1;
                mpCache[key] = index;
                return index;
            };

            for (let i = 0; i < numDivisions; i ++) {
                let newFaces = [];
                for (let j = 0; j < faces.length; j ++) {
                    let tri = faces[j];

                    let v1 = mp(tri[0], tri[1]);
                    let v2 = mp(tri[1], tri[2]);
                    let v3 = mp(tri[2], tri[0]);

                    newFaces.push([tri[0], v1, v3]);
                    newFaces.push([tri[1], v2, v1]);
                    newFaces.push([tri[2], v3, v2]);
                    newFaces.push([v1, v2, v3]);
                }
                faces = newFaces;
            }
            
            const mesh = new Mesh();
            mesh.setVertices(vertices);

            let faces2 = [];
            for (let i = 0; i < faces.length; i ++) {
                faces2.push(faces[i][0]);
                faces2.push(faces[i][1]);
                faces2.push(faces[i][2]);
            }

            mesh.setFaces(faces2);

            return mesh;
        }
    }

    Mesh.icosphere = Mesh.constructIcosphere(1, 4);
    Mesh.plane = Mesh.constructPlane(10, 10);
    
    function loadShader (gl, type, source) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    class Framebuffer {
        constructor (gl, id, n, width, height) {
            this.width = width;
            this.height = height;

            this.id = id;
            this.n = n;

            this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.activeTexture(gl.TEXTURE0 + this.n);

            const level = 0;
            const internalFormat = gl.RGBA;
            const border = 0;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            const data = null;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);
            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            this.buffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);

            const attachmentPoint = gl.COLOR_ATTACHMENT0;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, this.texture, level);

            this.depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
        }

        renderToBuffer (program) {
            let gl = program.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.viewport(0, 0, this.width, this.height);
            gl.clearColor(0, 0, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            program.display();
        }
    }

    class Texture {
        constructor (width, height, data) {
            this.width = width;
            this.height = height;
            this.data = data;
        }

        getColor (x, y) {
            let index = x + y * this.width << 2;
            let r = this.data[index] | 0;
            let g = this.data[index + 1] | 0;
            let b = this.data[index + 2] | 0;
            let a = this.data[index + 3] | 0;
            return a << 24 | r << 16 | g << 8 | b;
        }
    }

    class Program {
        constructor (gl, vsSource, fsSource) {
            this.gl = gl;
            this.vertexShader = loadShader(this.gl, this.gl.VERTEX_SHADER, vsSource);
            this.fragmentShader = loadShader(this.gl, this.gl.FRAGMENT_SHADER, fsSource);

            this.program = this.gl.createProgram();
            this.gl.attachShader(this.program, this.vertexShader);
            this.gl.attachShader(this.program, this.fragmentShader);
            this.gl.linkProgram(this.program);

            this.attribLocations = {};
            this.uniformLocations = {};
            this.buffers = {};

            this.gl.useProgram(this.program);
        }

        addAttribLocation (id) {
            this.attribLocations[id] = this.gl.getAttribLocation(this.program, id);
        }

        addUniformLocation (id) {
            this.uniformLocations[id] = this.gl.getUniformLocation(this.program, id);
        }

        addBuffer(id, type) {
            let buffer = this.gl.createBuffer();
            this.gl.bindBuffer(type, buffer);
            this.buffers[id] = type;
        }

        setBufferData(type, data, usage=35044) {
            this.gl.bufferData(type, new Float32Array(data), usage);
        }

        setUniform(id, type, args) {
            this.gl["uniform" + type].apply(null, [this.uniformLocations[id]].concat(args));
        }

        setUniformMatrix(id, type, args) {
            this.gl["uniformMatrix"+type](this.uniformLocations[id], false, args);
        }

        injectTexture2D(id, n, textureObject) {
            let tex = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.activeTexture(this.gl.TEXTURE0 + n);            
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, textureObject.width, textureObject.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, textureObject.data);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.setUniform(uniformName, "1i", [n]);
        }

        injectFramebufferTexture(fbo) {
            this.setUniform(fbo.id, "1i", [fbo.n]);
        }

    }

    XGL.Mesh = Mesh;
    XGL.vec3 = vec3;
    XGL.quat = quat;
}) ();