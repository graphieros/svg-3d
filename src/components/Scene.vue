<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import VDUI_3D from "../lib";
import { convertColorToHex, lightenHexColor } from "@/lib/color-utils";

const svgRef = ref(null);
const isDebug = ref(true);

const cameraDistance = ref(400);
const cameraPan = ref({ x: 100, y: -60, z: -60 });

const settings = ref({
    width: 800,
    height: 600,
    fov: 60,
    near: 0.1,
    far: 300
});

const rotationX = ref(-30);
const rotationY = ref(60);

const gridGap = 1;
const gridPaddingCells = ref(1); // extra empty cells around cubes

const eye = computed(() => ({
    x: cameraPan.value.x,
    y: 25 + cameraPan.value.y,
    z: -cameraDistance.value + cameraPan.value.z
}));

const baseTarget = { x: 0, y: 10, z: 0 };
const target = computed(() => ({
    x: baseTarget.x + cameraPan.value.x,
    y: baseTarget.y + cameraPan.value.y,
    z: baseTarget.z + cameraPan.value.z
}));

const up = { x: 0, y: 1, z: 0 };

const lightDir = ref(VDUI_3D.Vec3.normalize({ x: 1, y: 2, z: 2 }));

function makeWeek(col, rowStart) {
    const w = [];
    for (let i = 0; i < 7; i += 1) {
        w.push({
            value: Math.random() * 20,
            color: "#4caf50",
            col,
            row: rowStart + i
        });
    }
    return w;
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

// ------------------------------------------------------------
// Cubes
// ------------------------------------------------------------
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


const lightCircleCenter = computed(() => ({
    x: settings.value.width - 100,
    y: 100
}));
const lightCircleRadius = 60;

const lightCircleDot = computed(() =>
    VDUI_3D.lightDirToCircleCoords(lightDir.value, lightCircleCenter.value, lightCircleRadius)
);

let isDragging = false;
let isPanning = false;
let isLightDragging = false;

let lastX = 0;
let lastY = 0;

function updateLightFromPointerEvent(e) {
    const svgEl = svgRef.value;
    if (!svgEl) return;

    const rect = svgEl.getBoundingClientRect();

    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;

    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;

    const svgX = ((clientX - rect.left) / rect.width) * settings.value.width;
    const svgY = ((clientY - rect.top) / rect.height) * settings.value.height;

    const deltaX = svgX - lightCircleCenter.value.x;
    const deltaY = lightCircleCenter.value.y - svgY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const clampedDistance = Math.min(distance, lightCircleRadius);

    const clampedX = distance > 1e-6 ? (deltaX / distance) * clampedDistance : 0;
    const clampedY = distance > 1e-6 ? (deltaY / distance) * clampedDistance : 0;

    const normalizedX = clampedX / lightCircleRadius;
    const normalizedY = clampedY / lightCircleRadius;

    const radiusSquared = normalizedX * normalizedX + normalizedY * normalizedY;
    const normalizedZUnsigned = Math.sqrt(Math.max(0, 1 - radiusSquared));
    const normalizedZ = e.shiftKey ? -normalizedZUnsigned : normalizedZUnsigned;

    lightDir.value = VDUI_3D.Vec3.normalize({ x: normalizedX, y: normalizedY, z: normalizedZ });
}

function onLightPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();

    isLightDragging = true;
    isDragging = false;
    isPanning = false;

    updateLightFromPointerEvent(e);
}

function onLightPointerMove(e) {
    if (!isLightDragging) return;
    e.preventDefault();
    updateLightFromPointerEvent(e);
}

function onLightPointerUp() {
    isLightDragging = false;
}

function worldUnitsPerPixel() {
    const fovRad = (settings.value.fov * Math.PI) / 180;
    const viewportWorldHeight = 2 * cameraDistance.value * Math.tan(fovRad / 2);
    return viewportWorldHeight / settings.value.height;
}

function panFromMouseDelta(dx, dy) {
    const s = worldUnitsPerPixel();

    const yaw = (rotationY.value * Math.PI) / 180;
    const right = { x: Math.cos(yaw), z: Math.sin(yaw) };
    const forward = { x: -Math.sin(yaw), z: Math.cos(yaw) };

    cameraPan.value = {
        x: cameraPan.value.x + (-dx * s) * right.x + (dy * s) * forward.x,
        y: cameraPan.value.y,
        z: cameraPan.value.z + (-dx * s) * right.z + (dy * s) * forward.z
    };
}

function onMouseDown(e) {
    if (isLightDragging) return;

    if (e.button === 2 || e.button === 1) {
        isPanning = true;
        isDragging = false;
        lastX = e.clientX;
        lastY = e.clientY;
        return;
    }

    isDragging = true;
    isPanning = false;

    lastX = e.clientX;
    lastY = e.clientY;
}

function onMouseMove(e) {
    if (isLightDragging) return;

    if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        panFromMouseDelta(dx, dy);
        return;
    }

    if (!isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    lastX = e.clientX;
    lastY = e.clientY;

    rotationY.value -= dx * 0.5;
    rotationX.value -= dy * 0.5;

    if (rotationX.value > 89) rotationX.value = 89;
    if (rotationX.value < -89) rotationX.value = -89;
}

function onMouseUp() {
    isDragging = false;
    isPanning = false;
    isLightDragging = false;
}

function onWheel(e) {
    e.preventDefault();

    const minDistance = 20;
    const maxDistance = 1200;

    const direction = e.deltaY > 0 ? 1 : -1;

    const baseStep = 6;
    const scaledStep = Math.max(baseStep, cameraDistance.value * 0.04);

    cameraDistance.value = Math.max(
        minDistance,
        Math.min(maxDistance, cameraDistance.value + direction * scaledStep)
    );
}

function formatLabel(value, rounding = 0, suffix = "") {
    return `${value >= 0 ? "+" : ""}${value.toFixed(rounding)}${suffix}`;
}

onMounted(() => {
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mouseleave", onMouseUp);
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    window.addEventListener("mousemove", onLightPointerMove, { passive: false });
    window.addEventListener("mouseup", onLightPointerUp);
    window.addEventListener("mouseleave", onLightPointerUp);
});

onBeforeUnmount(() => {
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("mouseleave", onMouseUp);
    window.removeEventListener("mousemove", onMouseMove);

    window.removeEventListener("mousemove", onLightPointerMove);
    window.removeEventListener("mouseup", onLightPointerUp);
    window.removeEventListener("mouseleave", onLightPointerUp);
});
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