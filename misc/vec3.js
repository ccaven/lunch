export const vec3 = {
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