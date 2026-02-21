<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import VDUI_3D from "../lib";
import { convertColorToHex, lightenHexColor, colorFromValueWithMax } from "@/lib/color-utils";
import { useVdui3dControls } from "@/composables/use3dControls";

const svgRef = ref(null);
const isDebug = ref(true);

const settings = ref({
    width: 800,
    height: 600,
    fov: 60,
    near: 0.1,
    far: 300
});

const { cameraDistance, cameraPan, rotationX, rotationY, eye, target, up, lightDir, lightCircleCenter, lightCircleRadius, lightCircleDot, onMouseDown, onWheel, onLightPointerDown } = useVdui3dControls({
    svgRef,
    settings,
    VDUI_3D
})

const gridGap = 1;
const gridPaddingCells = ref(1); // extra empty cells around cubes

function makeWeek(col, rowStart, { maxValue = 20, baseColor = "#4caf50" } = {}) {
    const week = [];

    for (let i = 0; i < 7; i += 1) {
        week.push({
            value: Math.random() * maxValue,
            col,
            row: rowStart + i
        });
    }

    return week.map((item) => ({
        ...item,
        color: colorFromValueWithMax({
            value: item.value,
            maxValue,
            baseColor
        })
    }));
}

function makeGraph(weeks, colStart) {
    const y = [];
    for (let i = 0; i < weeks; i += 1) y.push(makeWeek(colStart + i, -3));
    return y.flat();
}

const cubes = ref(makeGraph(52, -8));

const cubeBase = {
    width: 6,
    depth: 6,
    heightFactor: 1
};

const model = computed(() =>
    VDUI_3D.createModel({
        eye: eye.value,
        target: target.value,
        up,
        rotationX: rotationX.value,
        rotationY: rotationY.value,
        fov: settings.value.fov,
        width: settings.value.width,
        height: settings.value.height,
        near: settings.value.near,
        far: settings.value.far,
        floorLevel: 0
    })
);

function clipPolygonAgainstNearPlaneInViewSpace(viewSpaceVertices, nearClipZ) {
    const result = [];
    const count = viewSpaceVertices.length;

    for (let index = 0; index < count; index += 1) {
        const current = viewSpaceVertices[index];
        const next = viewSpaceVertices[(index + 1) % count];

        const currentInside = current.z >= nearClipZ;
        const nextInside = next.z >= nearClipZ;

        if (currentInside && nextInside) {
            result.push({ x: next.x, y: next.y, z: next.z });
            continue;
        }

        if (currentInside && !nextInside) {
            const t = (nearClipZ - current.z) / (next.z - current.z);
            result.push({
                x: current.x + (next.x - current.x) * t,
                y: current.y + (next.y - current.y) * t,
                z: nearClipZ
            });
            continue;
        }

        if (!currentInside && nextInside) {
            const t = (nearClipZ - current.z) / (next.z - current.z);
            result.push({
                x: current.x + (next.x - current.x) * t,
                y: current.y + (next.y - current.y) * t,
                z: nearClipZ
            });
            result.push({ x: next.x, y: next.y, z: next.z });
        }
    }

    return result;
}

function projectViewSpaceVertexToSvgPoint(viewSpaceVertex, modelBundle, svgWidth, svgHeight) {
    const clipSpace = VDUI_3D.Mat4.multiplyVector(modelBundle.projection, viewSpaceVertex);

    if (!Number.isFinite(clipSpace.w) || Math.abs(clipSpace.w) <= 1e-6) return null;

    const ndc = VDUI_3D.perspectiveDivide(clipSpace);
    const svgPoint = VDUI_3D.ndcToSVG(ndc, svgWidth, svgHeight);

    if (!Number.isFinite(svgPoint.x) || !Number.isFinite(svgPoint.y)) return null;

    return { x: svgPoint.x, y: svgPoint.y };
}

const gridBoundsWorld = computed(() => {
    const cellX = cubeBase.width + gridGap;
    const cellZ = cubeBase.depth + gridGap;

    if (!cubes.value.length) {
        return {
            cellX,
            cellZ,
            minX: -cellX * 5 - cellX / 2,
            maxX: cellX * 5 + cellX / 2,
            minZ: -cellZ * 5 - cellZ / 2,
            maxZ: cellZ * 5 + cellZ / 2
        };
    }

    let minCol = Infinity;
    let maxCol = -Infinity;
    let minRow = Infinity;
    let maxRow = -Infinity;

    for (const c of cubes.value) {
        if (c.col < minCol) minCol = c.col;
        if (c.col > maxCol) maxCol = c.col;
        if (c.row < minRow) minRow = c.row;
        if (c.row > maxRow) maxRow = c.row;
    }

    const pad = Math.max(0, gridPaddingCells.value ?? 0);
    minCol -= pad;
    maxCol += pad;
    minRow -= pad;
    maxRow += pad;

    const minCenterX = minCol * cellX;
    const maxCenterX = maxCol * cellX;

    const minCenterZ = -maxRow * cellZ;
    const maxCenterZ = -minRow * cellZ;

    const minX = minCenterX - cellX / 2;
    const maxX = maxCenterX + cellX / 2;
    const minZ = minCenterZ - cellZ / 2;
    const maxZ = maxCenterZ + cellZ / 2;

    return { cellX, cellZ, minX, maxX, minZ, maxZ };
});

const floor = computed(() => {
    const { minX, maxX, minZ, maxZ } = gridBoundsWorld.value;

    const floorY = 0;

    const worldCorners = [
        { x: minX, y: floorY, z: minZ },
        { x: maxX, y: floorY, z: minZ },
        { x: maxX, y: floorY, z: maxZ },
        { x: minX, y: floorY, z: maxZ }
    ];

    const nearClipZ = settings.value.near + 1e-3;

    const modelViewMatrix = VDUI_3D.Mat4.multiply(model.value.view, model.value.mod);

    const viewCorners = worldCorners.map((corner) =>
        VDUI_3D.Mat4.multiplyVector(modelViewMatrix, corner)
    );

    const clippedViewPolygon = clipPolygonAgainstNearPlaneInViewSpace(viewCorners, nearClipZ);

    if (clippedViewPolygon.length < 3) return { points: "", depth: 0, visible: false };

    const projected = clippedViewPolygon
        .map((viewVertex) =>
            projectViewSpaceVertexToSvgPoint(viewVertex, model.value, settings.value.width, settings.value.height)
        )
        .filter((p) => p !== null);

    if (projected.length < 3) return { points: "", depth: 0, visible: false };

    const depth = Math.min(...clippedViewPolygon.map((v) => v.z));

    return {
        points: projected.map((p) => `${p.x},${p.y}`).join(" "),
        depth,
        visible: true
    };
});

const floorGrid = computed(() => {
    const y = 0;

    const { cellX, cellZ, minX, maxX, minZ, maxZ } = gridBoundsWorld.value;

    const nearClip = settings.value.near;

    const project = (vertex) =>
        VDUI_3D.projectVertex({
            vertex,
            model: model.value,
            width: settings.value.width,
            height: settings.value.height
        });

    const isUsablePoint = (p) => {
        if (!p || !p.visible) return false;
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;

        const margin = 2000;
        if (p.x < -margin || p.x > settings.value.width + margin) return false;
        if (p.y < -margin || p.y > settings.value.height + margin) return false;

        return true;
    };

    const clipSegmentToNear = (aWorld, bWorld) => {
        const aProj = project(aWorld);
        const bProj = project(bWorld);

        const aInFront = aProj.viewZ >= nearClip;
        const bInFront = bProj.viewZ >= nearClip;

        if (!aInFront && !bInFront) return null;
        if (aInFront && bInFront) return { aProj, bProj };

        const t = (nearClip - aProj.viewZ) / (bProj.viewZ - aProj.viewZ);

        const iWorld = {
            x: aWorld.x + (bWorld.x - aWorld.x) * t,
            y: aWorld.y + (bWorld.y - aWorld.y) * t,
            z: aWorld.z + (bWorld.z - aWorld.z) * t
        };

        const iProj = project(iWorld);

        if (aInFront) return { aProj, bProj: iProj };
        return { aProj: iProj, bProj };
    };

    const lines = [];

    for (let x = minX; x <= maxX + 1e-6; x += cellX) {
        const clipped = clipSegmentToNear({ x, y, z: minZ }, { x, y, z: maxZ });
        if (!clipped) continue;

        const { aProj, bProj } = clipped;
        if (isUsablePoint(aProj) && isUsablePoint(bProj)) {
            lines.push({
                x1: aProj.x,
                y1: aProj.y,
                x2: bProj.x,
                y2: bProj.y,
                depth: Math.min(aProj.depth, bProj.depth),
                key: `v-${x.toFixed(3)}`
            });
        }
    }

    for (let z = minZ; z <= maxZ + 1e-6; z += cellZ) {
        const clipped = clipSegmentToNear({ x: minX, y, z }, { x: maxX, y, z });
        if (!clipped) continue;

        const { aProj, bProj } = clipped;
        if (isUsablePoint(aProj) && isUsablePoint(bProj)) {
            lines.push({
                x1: aProj.x,
                y1: aProj.y,
                x2: bProj.x,
                y2: bProj.y,
                depth: Math.min(aProj.depth, bProj.depth),
                key: `h-${z.toFixed(3)}`
            });
        }
    }

    return lines.sort((a, b) => a.depth - b.depth);
});

const allFaces = computed(() => {
    const faces = [];

    for (const [cubeIndex, cube] of cubes.value.entries()) {
        const width = cubeBase.width;
        const depth = cubeBase.depth;
        const height = cube.value * cubeBase.heightFactor;

        const offset = {
            x: cube.col * (cubeBase.width + gridGap),
            y: 0,
            z: -cube.row * (cubeBase.depth + gridGap)
        };

        const faceColors = [
            cube.color,
            lightenHexColor(convertColorToHex(cube.color), 0.08),
            lightenHexColor(convertColorToHex(cube.color), 0.14),
            lightenHexColor(convertColorToHex(cube.color), -0.1),
            lightenHexColor(convertColorToHex(cube.color), 0.22),
            lightenHexColor(convertColorToHex(cube.color), -0.18)
        ];

        const cubeFaces = VDUI_3D.createCube({
            width,
            height,
            depth,
            svgWidth: settings.value.width,
            svgHeight: settings.value.height,
            model: model.value,
            faceColors,
            offset,
            lightDir: lightDir.value
        });

        cubeFaces.forEach((face, faceIndex) => {
            faces.push({
                ...face,
                cubeIndex,
                faceIndex,
                id: `${cubeIndex}-${faceIndex}`
            });
        });
    }

    faces.sort((a, b) => b.faceDepth - a.faceDepth);
    return faces;
});

function formatLabel(value, rounding = 0, suffix = "") {
    return `${value >= 0 ? "+" : ""}${value.toFixed(rounding)}${suffix}`;
}

</script>

<template>
    <div style="display: inline-block; background: #111; padding: 16px;">
        <svg
            :width="settings.width"
            :height="settings.height"
            ref="svgRef"
            style="overflow: hidden"
            @mousedown="onMouseDown"
            @wheel="onWheel"
            @contextmenu.prevent
        >
            <!-- FLOOR (wraps cubes) -->
            <g v-if="floor.visible">
                <polygon
                    :points="floor.points"
                    fill="rgba(255,255,255,0.03)"
                    stroke="rgba(255,255,255,0.08)"
                    stroke-width="1"
                />
                <line
                    v-for="l in floorGrid"
                    :key="l.key"
                    :x1="l.x1"
                    :y1="l.y1"
                    :x2="l.x2"
                    :y2="l.y2"
                    stroke="rgba(255,255,255,0.06)"
                    stroke-width="1"
                    vector-effect="non-scaling-stroke"
                    stroke-linecap="round"
                />
            </g>

            <!-- CUBES -->
            <g>
                <polygon
                    v-for="face in allFaces"
                    :key="face.id"
                    :points="face.points"
                    :fill="face.color"
                    stroke="#000"
                    stroke-width="0.5"
                />
            </g>

            <!-- LIGHT CONTROL -->
            <g v-if="isDebug">
                <circle
                    :cx="lightCircleCenter.x"
                    :cy="lightCircleCenter.y"
                    :r="lightCircleRadius"
                    fill="rgba(255,255,255,0.03)"
                    stroke="#3A3A3A"
                    stroke-width="1"
                    @mousedown.stop.prevent="onLightPointerDown"
                />
                <circle
                    :cx="lightCircleCenter.x"
                    :cy="lightCircleCenter.y"
                    r="2"
                    fill="#DDDD99"
                    @mousedown.stop.prevent="onLightPointerDown"
                />
                <line
                    :x1="lightCircleCenter.x"
                    :y1="lightCircleCenter.y"
                    :x2="lightCircleDot.x"
                    :y2="lightCircleDot.y"
                    stroke="#DDDD99"
                    stroke-width="1"
                    stroke-dasharray="2"
                />
                <circle
                    :cx="lightCircleDot.x"
                    :cy="lightCircleDot.y"
                    r="4"
                    fill="#DDDD99"
                    @mousedown.stop.prevent="onLightPointerDown"
                />
                <text
                    :x="lightCircleCenter.x"
                    :y="lightCircleCenter.y + lightCircleRadius + 16"
                    fill="#DDDD99"
                    text-anchor="middle"
                    font-size="10"
                >
                    LIGHT
                </text>
            </g>

            <!-- DEBUG -->
            <g v-if="isDebug">
                <rect x="10" y="10" width="300" height="112" fill="#1A1A1A" stroke="#2A2A2A" />
                <text x="20" y="30" fill="#99DD99" font-size="12">
                    X rotation: {{ formatLabel(rotationX, 1, "°") }}
                </text>
                <text x="20" y="45" fill="#99DD99" font-size="12">
                    Y rotation: {{ formatLabel(rotationY, 1, "°") }}
                </text>
                <text x="20" y="60" fill="#99DD99" font-size="12">
                    Zoom (distance): {{ formatLabel(cameraDistance, 1) }}
                </text>
                <text x="20" y="75" fill="#99DD99" font-size="12">
                    Pan: ({{ formatLabel(cameraPan.x, 1) }}, {{ formatLabel(cameraPan.y, 1) }}, {{ formatLabel(cameraPan.z, 1) }})
                </text>
                <text x="20" y="90" fill="#99DD99" font-size="12">
                    Grid padding (cells): {{ gridPaddingCells }}
                </text>
                <text x="20" y="105" fill="#DDDD99" font-size="12">
                    Light: ({{ formatLabel(lightDir.x, 2) }}, {{ formatLabel(lightDir.y, 2) }}, {{ formatLabel(lightDir.z, 2) }})
                </text>
            </g>
        </svg>
    </div>
</template>

<style scoped>
svg {
    user-select: none;
    touch-action: none;
    overflow: visible;
    cursor: grab;
    background: radial-gradient(circle at top, #333 0, #111 60%);
}
svg:active {
    cursor: grabbing;
}
text {
    font-variant-numeric: tabular-nums;
}
</style>