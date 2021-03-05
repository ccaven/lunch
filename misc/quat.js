import { vec3 } from "vec3.js";

export const quat = {
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
