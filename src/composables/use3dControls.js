import { ref, computed, onMounted, onBeforeUnmount } from "vue";

export function useVdui3dControls({ svgRef, settings, VDUI_3D }) {
    const defaultSettings = {
        cameraDistance: 400,
        cameraPan: { x: 152, y: -60, z: 79 },
        lightDir: { x: -0.7, y: 0.7, z: 0 },
        rotationX: -16.5,
        rotationY: 50.5
    }

    const cameraDistance = ref(defaultSettings.cameraDistance);
    const cameraPan = ref(defaultSettings.cameraPan);
    const lightDir = ref(VDUI_3D.Vec3.normalize(defaultSettings.lightDir));
    const rotationX = ref(defaultSettings.rotationX);
    const rotationY = ref(defaultSettings.rotationY);

    function resetSettings() {
        cameraDistance.value = defaultSettings.cameraDistance;
        cameraPan.value = defaultSettings.cameraPan;
        lightDir.value = VDUI_3D.Vec3.normalize(defaultSettings.lightDir);
        rotationX.value = defaultSettings.rotationX;
        rotationY.value = defaultSettings.rotationY;
    }

    const areSettingsChanged = computed(() => {

        const _lightDirDefault = VDUI_3D.Vec3.normalize(defaultSettings.lightDir)

        return cameraDistance.value !== defaultSettings.cameraDistance
            || cameraPan.value.x !== defaultSettings.cameraPan.x
            || cameraPan.value.y !== defaultSettings.cameraPan.y
            || cameraPan.value.z !== defaultSettings.cameraPan.z
            || lightDir.value.x !== _lightDirDefault.x
            || lightDir.value.y !== _lightDirDefault.y
            || lightDir.value.z !== _lightDirDefault.z
            || rotationX.value !== defaultSettings.rotationX
            || rotationY.value !== defaultSettings.rotationY
    })

    const baseTarget = { x: 0, y: 10, z: 0 };
    const up = { x: 0, y: 1, z: 0 };

    const eye = computed(() => ({
        x: cameraPan.value.x,
        y: 25 + cameraPan.value.y,
        z: -cameraDistance.value + cameraPan.value.z,
    }));

    const target = computed(() => ({
        x: baseTarget.x + cameraPan.value.x,
        y: baseTarget.y + cameraPan.value.y,
        z: baseTarget.z + cameraPan.value.z,
    }));

    const lightCircleCenter = computed(() => ({
        x: settings.value.width - 100,
        y: 100,
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

        const clientX = "touches" in e ? e.touches?.[0]?.clientX : e.clientX;
        const clientY = "touches" in e ? e.touches?.[0]?.clientY : e.clientY;

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
            z: cameraPan.value.z + (-dx * s) * right.z + (dy * s) * forward.z,
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

    return {
        // state
        cameraDistance,
        cameraPan,
        rotationX,
        rotationY,
        eye,
        target,
        up,
        lightDir,
        areSettingsChanged,

        // light
        lightCircleCenter,
        lightCircleRadius,
        lightCircleDot,

        // handlers
        onMouseDown,
        onWheel,
        onLightPointerDown,
        
        // actions
        resetSettings
    };
}
