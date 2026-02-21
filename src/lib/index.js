import { convertColorToHex } from "./color-utils";

const VDUI_3D = {};

VDUI_3D.floorLevel = 0;


// 3D Vector Utilities
VDUI_3D.Vec3 = {
    create: function (x, y, z) {
        return { x: x || 0, y: y || 0, z: z || 0 };
    },
    add: function (a, b) {
        return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    },
    subtract: function (a, b) {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    },
    scale: function (v, s) {
        return { x: v.x * s, y: v.y * s, z: v.z * s };
    },
    dot: function (a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    },
    cross: function (a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    },
    length: function (v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    },
    normalize: function (v) {
        const len = VDUI_3D.Vec3.length(v);
        if (len === 0) return { x: 0, y: 0, z: 0 };
        return { x: v.x / len, y: v.y / len, z: v.z / len };
    },
    lerp: function (a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t
        };
    }
};

// 4x4 Matrix Utilities (Mat4)
VDUI_3D.Mat4 = {
    identity: function () {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },

    multiply: function (a, b) {
        const result = new Array(16);
        for (let row = 0; row < 4; row += 1) {
            for (let col = 0; col < 4; col += 1) {
                let sum = 0;
                for (let i = 0; i < 4; i += 1) {
                    sum += a[row * 4 + i] * b[i * 4 + col];
                }
                result[row * 4 + col] = sum;
            }
        }
        return result;
    },

    multiplyVector: function (m, v) {
        const x = v.x, y = v.y, z = v.z, w = 1;
        return {
            x: m[0] * x + m[1] * y + m[2] * z + m[3] * w,
            y: m[4] * x + m[5] * y + m[6] * z + m[7] * w,
            z: m[8] * x + m[9] * y + m[10] * z + m[11] * w,
            w: m[12] * x + m[13] * y + m[14] * z + m[15] * w
        };
    },

    translation: function (tx, ty, tz) {
        return [
            1, 0, 0, tx,
            0, 1, 0, ty,
            0, 0, 1, tz,
            0, 0, 0, 1
        ];
    },

    scaling: function (sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1
        ];
    },

    rotationX: function (angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        ];
    },

    rotationY: function (angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1
        ];
    },

    rotationZ: function (angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    },

    perspective: function (fov, aspect, near, far) {
        const fovRad = fov * Math.PI / 180;
        const f = 1.0 / Math.tan(fovRad / 2);

        const m = VDUI_3D.Mat4.identity();
        m[0] = f / aspect;
        m[5] = f;

        // LH depth: z in [0..1] after divide
        m[10] = far / (far - near);
        m[11] = (-near * far) / (far - near);

        // Perspective term (w = z)
        m[14] = 1;
        m[15] = 0;

        return m;
    },

    lookAt: function (eye, target, up) {
        const zAxis = VDUI_3D.Vec3.normalize(VDUI_3D.Vec3.subtract(target, eye)); // forward
        const xAxis = VDUI_3D.Vec3.normalize(VDUI_3D.Vec3.cross(up, zAxis));// right
        const yAxis = VDUI_3D.Vec3.cross(zAxis, xAxis); // up

        return [
            xAxis.x, xAxis.y, xAxis.z, -VDUI_3D.Vec3.dot(xAxis, eye),
            yAxis.x, yAxis.y, yAxis.z, -VDUI_3D.Vec3.dot(yAxis, eye),
            zAxis.x, zAxis.y, zAxis.z, -VDUI_3D.Vec3.dot(zAxis, eye),
            0, 0, 0, 1
        ];
    }
};

// Utils
VDUI_3D.degToRad = function (deg) {
    return deg * Math.PI / 180;
};

VDUI_3D.perspectiveDivide = function (v) {
    if (v.w === 0) return { x: 0, y: 0 };
    return { x: v.x / v.w, y: v.y / v.w };
};

VDUI_3D.ndcToSVG = function (ndc, svgWidth, svgHeight) {
    return {
        x: (ndc.x + 1) * 0.5 * svgWidth,
        y: (1 - (ndc.y + 1) * 0.5) * svgHeight
    };
};

VDUI_3D.chain = function () {
    const matrices = Array.from(arguments);
    return matrices.reduce(function (prev, curr) {
        return VDUI_3D.Mat4.multiply(prev, curr);
    }, VDUI_3D.Mat4.identity());
};

VDUI_3D.projectPoint = function ({
    point,
    modelMatrix,
    viewMatrix,
    projectionMatrix,
    svgWidth,
    svgHeight
}) {
    const mvMatrix = VDUI_3D.Mat4.multiply(viewMatrix, modelMatrix);
    const mvpMatrix = VDUI_3D.Mat4.multiply(projectionMatrix, mvMatrix);
    const transformed = VDUI_3D.Mat4.multiplyVector(mvpMatrix, point);
    const ndc = VDUI_3D.perspectiveDivide(transformed);
    return VDUI_3D.ndcToSVG(ndc, svgWidth, svgHeight);
};

VDUI_3D.createModel = function ({ eye, target, up, rotationX, rotationY, fov, width, height, near, far, floorLevel = 0 }) {
    VDUI_3D.floorLevel = floorLevel;
    return {
        mod: VDUI_3D.chain(
            VDUI_3D.Mat4.translation(0, 0, 0),
            VDUI_3D.Mat4.rotationX(VDUI_3D.degToRad(rotationX)),
            VDUI_3D.Mat4.rotationY(VDUI_3D.degToRad(rotationY))
        ),
        eye,
        target,
        up,
        view: VDUI_3D.Mat4.lookAt(eye, target, up),
        projection: VDUI_3D.Mat4.perspective(
            fov,
            width / height,
            near,
            far
        )
    };
}

VDUI_3D.projectVertex = function ({ vertex, model, width, height }) {
    const mvMatrix = VDUI_3D.Mat4.multiply(model.view, model.mod);
    const mvpMatrix = VDUI_3D.Mat4.multiply(model.projection, mvMatrix);

    const viewCoords = VDUI_3D.Mat4.multiplyVector(mvMatrix, vertex);
    const transformed = VDUI_3D.Mat4.multiplyVector(mvpMatrix, vertex);

    const w = transformed.w;
    const visible = Number.isFinite(w) && Math.abs(w) > 1e-6;

    if (!visible) {
        return { x: 0, y: 0, depth: 0, w, visible: false, viewZ: viewCoords.z };
    }

    const ndc = VDUI_3D.perspectiveDivide(transformed);
    const svgPoint = VDUI_3D.ndcToSVG(ndc, width, height);

    return {
        x: svgPoint.x,
        y: svgPoint.y,
        depth: viewCoords.z,
        w,
        visible: true,
        viewZ: viewCoords.z
    };
};

VDUI_3D.createCubeGeometry = function ({ width, height, depth, offset = { x: 0, y: 0, z: 0 } }) {
    const hx = width / 2;
    const hy = height / 2;
    const hz = depth / 2;
    const vertices = [
        { x: -hx + offset.x, y: -hy + offset.y, z: -hz + offset.z },
        { x:  hx + offset.x, y: -hy + offset.y, z: -hz + offset.z },
        { x:  hx + offset.x, y:  hy + offset.y, z: -hz + offset.z },
        { x: -hx + offset.x, y:  hy + offset.y, z: -hz + offset.z },
        { x: -hx + offset.x, y: -hy + offset.y, z:  hz + offset.z },
        { x:  hx + offset.x, y: -hy + offset.y, z:  hz + offset.z },
        { x:  hx + offset.x, y:  hy + offset.y, z:  hz + offset.z },
        { x: -hx + offset.x, y:  hy + offset.y, z:  hz + offset.z }
    ];
    const faces = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 1, 5, 4],
        [3, 2, 6, 7],
        [0, 3, 7, 4],
        [1, 2, 6, 5]
    ];
    return { vertices, faces };
};

VDUI_3D.transformNormal = function (m, n) {
    return VDUI_3D.Vec3.normalize({
        x: m[0] * n.x + m[1] * n.y + m[2] * n.z,
        y: m[4] * n.x + m[5] * n.y + m[6] * n.z,
        z: m[8] * n.x + m[9] * n.y + m[10] * n.z
    });
};

VDUI_3D.shadeColor = function ({ color, brightness }) {
    let hexColor = convertColorToHex(color);
    if (hexColor[0] === "#") {
        hexColor = hexColor.slice(1).replaceAll('-', '');
    }
    let r = parseInt(hexColor.substring(0, 2), 16);
    let g = parseInt(hexColor.substring(2, 4), 16);
    let b = parseInt(hexColor.substring(4, 6), 16);

    r = Math.floor(r * brightness);
    g = Math.floor(g * brightness);
    b = Math.floor(b * brightness);

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `rgb(${r}, ${g}, ${b})`;
}

VDUI_3D.lightDirToCircleCoords = function(lightDir, circleCenter = { x: 400, y: 300 }, circleRadius = 100) {
    const x = circleCenter.x + lightDir.x * circleRadius;
    const y = circleCenter.y - lightDir.y * circleRadius;
    return { x, y };
};

VDUI_3D.createCubeFaces = function ({ model, cubeFaces, cubeVertices, width, height, faceColors, lightDir, offset }) {
    if (!lightDir) {
        lightDir = VDUI_3D.Vec3.normalize({ x: 1, y: 12, z: 12 });
    }
    if (!offset) {
        offset = { x: 0, y: 0, z: 0 };
    }

    const baseFaceNormals = [
        { x: 0 + offset.x, y: 0 + offset.y, z: -1 + offset.z },
        { x: 0 + offset.x, y: 0 + offset.y, z: 1 + offset.z },
        { x: 1 + offset.x, y: 0 + offset.y, z: 0 + offset.z },
        { x: -1 + offset.x, y: 0 + offset.y, z: 0 + offset.z },
        { x: 0 + offset.x, y: 1 + offset.y, z: 0 + offset.z },
        { x: 0 + offset.x, y: -1 + offset.y, z: 0 + offset.z }
    ];

    const mvMatrix = VDUI_3D.Mat4.multiply(model.view, model.mod);
    const combinedMatrix = VDUI_3D.chain(model.view, model.mod);

    const faces = cubeFaces.map((faceIndices, index) => {
        const projectedVertices = faceIndices.map((idx) =>
            VDUI_3D.projectVertex({
                vertex: cubeVertices[idx],
                model,
                width,
                height
            })
        );

        const pointsStr = projectedVertices.map((p) => `${p.x},${p.y}`).join(" ");

        const depths = projectedVertices.map((p) => p.depth);

        // Painter's algorithm wants far -> near.
        // In view space with your lookAt, z is typically negative in front of the camera.
        // "Farther" => smaller (more negative). "Nearer" => larger (closer to 0).
        // Using the farthest vertex reduces incorrect overlaps compared to centroid.
        const faceDepth = Math.min.apply(null, depths);

        const baseColor = faceColors && faceColors[index] ? faceColors[index] : "#1f77b4";

        const objectSpaceNormal = baseFaceNormals[index];
        const transformedNormal = VDUI_3D.transformNormal(combinedMatrix, objectSpaceNormal);

        let brightness = VDUI_3D.Vec3.dot(transformedNormal, lightDir);
        brightness = Math.max(0, brightness);

        const ambient = 0.4;
        const finalBrightness = ambient + (1 - ambient) * brightness;

        const shadedColor = VDUI_3D.shadeColor({ color: baseColor, brightness: finalBrightness });

        return { points: pointsStr, faceDepth, color: shadedColor };
    });

    return faces.sort((a, b) => a.faceDepth - b.faceDepth);
};

VDUI_3D.createCube = function({ width, height, depth, svgWidth, svgHeight, model, faceColors, offset, lightDir }) {
    offset = offset || { x: 0, y: 0, z: 0 };
    offset.y = VDUI_3D.floorLevel + height / 2;
    const { vertices: cubeVertices, faces: cubeFaces } =
        VDUI_3D.createCubeGeometry({ width, height, depth, offset });
    return VDUI_3D.createCubeFaces({
        model,
        cubeFaces,
        cubeVertices,
        width: svgWidth,
        height: svgHeight,
        faceColors,
        lightDir
    });
};

export default {
    ...VDUI_3D
};