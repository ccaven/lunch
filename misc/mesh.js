import { quat } from "./quat.js";
import { vec3 } from "./vec3.js";

export class Mesh {
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