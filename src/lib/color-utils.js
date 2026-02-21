import { isRef, unref } from "vue";

const COLOR_MAP = {
    ALICEBLUE: "#F0F8FF",
    ANTIQUEWHITE: "#FAEBD7",
    AQUA: "#00FFFF",
    AQUAMARINE: "#7FFFD4",
    AZURE: "#F0FFFF",
    BEIGE: "#F5F5DC",
    BISQUE: "#FFE4C4",
    BLACK: "#000000",
    BLANCHEDALMOND: "#FFEBCD",
    BLUE: "#0000FF",
    BLUEVIOLET: "#8A2BE2",
    BROWN: "#A52A2A",
    BURLYWOOD: "#DEB887",
    CADETBLUE: "#5F9EA0",
    CHARTREUSE: "#7FFF00",
    CHOCOLATE: "#D2691E",
    CORAL: "#FF7F50",
    CORNFLOWERBLUE: "#6495ED",
    CORNSILK: "#FFF8DC",
    CRIMSON: "#DC143C",
    CYAN: "#00FFFF",
    DARKBLUE: "#00008B",
    DARKCYAN: "#008B8B",
    DARKGOLDENROD: "#B8860B",
    DARKGREY: "#A9A9A9",
    DARKGREEN: "#006400",
    DARKKHAKI: "#BDB76B",
    DARKMAGENTA: "#8B008B",
    DARKOLIVEGREEN: "#556B2F",
    DARKORANGE: "#FF8C00",
    DARKORCHID: "#9932CC",
    DARKRED: "#8B0000",
    DARKSALMON: "#E9967A",
    DARKSEAGREEN: "#8FBC8F",
    DARKSLATEBLUE: "#483D8B",
    DARKSLATEGREY: "#2F4F4F",
    DARKTURQUOISE: "#00CED1",
    DARKVIOLET: "#9400D3",
    DEEPPINK: "#FF1493",
    DEEPSKYBLUE: "#00BFFF",
    DIMGRAY: "#696969",
    DODGERBLUE: "#1E90FF",
    FIREBRICK: "#B22222",
    FLORALWHITE: "#FFFAF0",
    FORESTGREEN: "#228B22",
    FUCHSIA: "#FF00FF",
    GAINSBORO: "#DCDCDC",
    GHOSTWHITE: "#F8F8FF",
    GOLD: "#FFD700",
    GOLDENROD: "#DAA520",
    GREY: "#808080",
    GREEN: "#008000",
    GREENYELLOW: "#ADFF2F",
    HONEYDEW: "#F0FFF0",
    HOTPINK: "#FF69B4",
    INDIANRED: "#CD5C5C",
    INDIGO: "#4B0082",
    IVORY: "#FFFFF0",
    KHAKI: "#F0E68C",
    LAVENDER: "#E6E6FA",
    LAVENDERBLUSH: "#FFF0F5",
    LAWNGREEN: "#7CFC00",
    LEMONCHIFFON: "#FFFACD",
    LIGHTBLUE: "#ADD8E6",
    LIGHTCORAL: "#F08080",
    LIGHTCYAN: "#E0FFFF",
    LIGHTGOLDENRODYELLOW: "#FAFAD2",
    LIGHTGREY: "#D3D3D3",
    LIGHTGREEN: "#90EE90",
    LIGHTPINK: "#FFB6C1",
    LIGHTSALMON: "#FFA07A",
    LIGHTSEAGREEN: "#20B2AA",
    LIGHTSKYBLUE: "#87CEFA",
    LIGHTSLATEGREY: "#778899",
    LIGHTSTEELBLUE: "#B0C4DE",
    LIGHTYELLOW: "#FFFFE0",
    LIME: "#00FF00",
    LIMEGREEN: "#32CD32",
    LINEN: "#FAF0E6",
    MAGENTA: "#FF00FF",
    MAROON: "#800000",
    MEDIUMAQUAMARINE: "#66CDAA",
    MEDIUMBLUE: "#0000CD",
    MEDIUMORCHID: "#BA55D3",
    MEDIUMPURPLE: "#9370D8",
    MEDIUMSEAGREEN: "#3CB371",
    MEDIUMSLATEBLUE: "#7B68EE",
    MEDIUMSPRINGGREEN: "#00FA9A",
    MEDIUMTURQUOISE: "#48D1CC",
    MEDIUMVIOLETRED: "#C71585",
    MIDNIGHTBLUE: "#191970",
    MINTCREAM: "#F5FFFA",
    MISTYROSE: "#FFE4E1",
    MOCCASIN: "#FFE4B5",
    NAVAJOWHITE: "#FFDEAD",
    NAVY: "#000080",
    OLDLACE: "#FDF5E6",
    OLIVE: "#808000",
    OLIVEDRAB: "#6B8E23",
    ORANGE: "#FFA500",
    ORANGERED: "#FF4500",
    ORCHID: "#DA70D6",
    PALEGOLDENROD: "#EEE8AA",
    PALEGREEN: "#98FB98",
    PALETURQUOISE: "#AFEEEE",
    PALEVIOLETRED: "#D87093",
    PAPAYAWHIP: "#FFEFD5",
    PEACHPUFF: "#FFDAB9",
    PERU: "#CD853F",
    PINK: "#FFC0CB",
    PLUM: "#DDA0DD",
    POWDERBLUE: "#B0E0E6",
    PURPLE: "#800080",
    RED: "#FF0000",
    ROSYBROWN: "#BC8F8F",
    ROYALBLUE: "#4169E1",
    SADDLEBROWN: "#8B4513",
    SALMON: "#FA8072",
    SANDYBROWN: "#F4A460",
    SEAGREEN: "#2E8B57",
    SEASHELL: "#FFF5EE",
    SIENNA: "#A0522D",
    SILVER: "#C0C0C0",
    SKYBLUE: "#87CEEB",
    SLATEBLUE: "#6A5ACD",
    SLATEGREY: "#708090",
    SNOW: "#FFFAFA",
    SPRINGGREEN: "#00FF7F",
    STEELBLUE: "#4682B4",
    TAN: "#D2B48C",
    TEAL: "#008080",
    THISTLE: "#D8BFD8",
    TOMATO: "#FF6347",
    TURQUOISE: "#40E0D0",
    VIOLET: "#EE82EE",
    WHEAT: "#F5DEB3",
    WHITE: "#FFFFFF",
    WHITESMOKE: "#F5F5F5",
    YELLOW: "#FFFF00",
    YELLOWGREEN: "#9ACD32",
    REBECCAPURPLE: "#663399"
};

export function convertNameColorToHex(colorName) {
    const v = isRef?.(colorName) ? unref(colorName) : colorName;
    if (typeof v !== 'string') return v;
    const s = v.trim();
    if (s === '') return s;
    if (s[0] === '#') return s;
    if (s.toLowerCase() === 'transparent') return '#FFFFFF00';
    const upper = s.toUpperCase();
    const normalized = upper.replace(/GRAY/g, 'GREY');
    return COLOR_MAP[upper] || COLOR_MAP[normalized] || s;
}

export function decimalToHex(decimal) {
    const hex = Number(decimal).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

export function clampToUnitInterval(value) {
    if (!Number.isFinite(value)) return 0;
    return value < 0 ? 0 : value > 1 ? 1 : value;
}

// OKLCH utility
export function parseCssAlpha(alphaRaw) {
    if (alphaRaw === undefined) return 1;
    if (typeof alphaRaw === "string" && alphaRaw.endsWith("%")) {
        const percent = parseFloat(alphaRaw);
        if (!Number.isFinite(percent)) return null;
        return clampToUnitInterval(percent / 100);
    }
    const value = parseFloat(alphaRaw);
    if (!Number.isFinite(value)) return null;
    return clampToUnitInterval(value);
}

// OKLCH utility
export function normalizeOklchLightness(lightnessRaw) {
    let lightness = Number(lightnessRaw);
    if (!Number.isFinite(lightness)) return null;
    if (lightness > 1) lightness = lightness / 100;
    return clampToUnitInterval(lightness);
}

// OKLCH utility
export function normalizeOklchChroma(chromaRaw) {
    let chroma = Number(chromaRaw);
    if (!Number.isFinite(chroma)) return null;
    if (chroma > 1) chroma = chroma / 100;
    return chroma < 0 ? 0 : chroma;
}

// OKLCH utility
export function normalizeHueDegrees(hueRaw) {
    const hue = Number(hueRaw);
    if (!Number.isFinite(hue)) return null;
    return hue;
}

export function convertColorToHex(color) {
    const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
    const rgbRegex = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i;
    const hslRegex =
        /^hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)$/i;
    const oklchRegex =
        /^oklch\(\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?)\s*)?\)$/i;
    const lchRegex = /^lch\(/i;

    if (
        color === undefined ||
        color === null ||
        (typeof color === "number" && isNaN(color))
    ) {
        return null;
    }

    color = isRef(color) ? unref(color) : color;

    color = convertNameColorToHex(color);

    if (Array.isArray(color)) {
        const [r, g, b, a = 1] = color;
        color = `rgba(${r},${g},${b},${a})`;
    } else if (typeof color === "object") {
        if (
            Number.isFinite(color.r) &&
            Number.isFinite(color.g) &&
            Number.isFinite(color.b)
        ) {
            const a = Number.isFinite(color.a) ? color.a : 1;
            color = `rgba(${color.r},${color.g},${color.b},${a})`;
        } else {
            return null;
        }
    } else if (typeof color === "number") {
        const n = color >>> 0;
        const hex = n.toString(16).padStart(n <= 0xffffff ? 6 : 8, "0");
        return `#${hex.length === 6 ? hex + "ff" : hex}`;
    } else if (typeof color !== "string") {
        return null;
    }

    color = color.trim();

    if (lchRegex.test(color)) {
        console.warn(
            "[convertColorToHex] lch() colors are not supported. Use oklch() instead.",
        );
        return null;
    }

    if (color.toLowerCase() === "transparent") {
        return "#FFFFFF00";
    }

    color = color.replace(shorthandRegex, (_, r, g, b, a) => {
        return `#${r}${r}${g}${g}${b}${b}${a ? a + a : ""}`;
    });

    let match;

    if ((match = color.match(hexRegex))) {
        const [, r, g, b, a] = match;
        const alpha = a ? parseInt(a, 16) / 255 : 1;
        return `#${r}${g}${b}${decimalToHex(Math.round(clampToUnitInterval(alpha) * 255))}`;
    }

    if ((match = color.match(rgbRegex))) {
        const [, r, g, b, a] = match;
        const alpha = a ? parseFloat(a) : 1;
        return `#${decimalToHex(r)}${decimalToHex(g)}${decimalToHex(b)}${decimalToHex(Math.round(clampToUnitInterval(alpha) * 255))}`;
    }

    if ((match = color.match(hslRegex))) {
        const [, h, s, l, a] = match;
        const alpha = a ? parseFloat(a) : 1;
        const [rr, gg, bb] = hslToRgba(Number(h), Number(s), Number(l));
        return `#${decimalToHex(rr)}${decimalToHex(gg)}${decimalToHex(bb)}${decimalToHex(Math.round(clampToUnitInterval(alpha) * 255))}`;
    }

    if ((match = color.match(oklchRegex))) {
        const [, lightnessRaw, chromaRaw, hueRaw, alphaRaw] = match;

        const lightness = normalizeOklchLightness(lightnessRaw);
        if (lightness === null) return null;

        const chroma = normalizeOklchChroma(chromaRaw);
        if (chroma === null) return null;

        const hueDegrees = normalizeHueDegrees(hueRaw);
        if (hueDegrees === null) return null;

        const alpha = parseCssAlpha(alphaRaw);
        if (alpha === null) return null;

        const [rr, gg, bb] = convertOklchToRgb(lightness, chroma, hueDegrees);
        return `#${decimalToHex(rr)}${decimalToHex(gg)}${decimalToHex(bb)}${decimalToHex(Math.round(clampToUnitInterval(alpha) * 255))}`;
    }

    return null;
}

export function lightenHexColor(hexColor, percentLighter) {
    if (typeof hexColor !== "string") {
        console.warn("lightenHexColor: Invalid input type");
        return "#000000";
    }

    if (!/^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(hexColor)) {
        console.warn("lightenHexColor: Invalid hex color format");
        return "#000000";
    }

    const clampUnit = (value) => {
        if (!Number.isFinite(value)) return 0;
        return value < -1 ? -1 : value > 1 ? 1 : value;
    };

    const clampByte = (value) => {
        if (!Number.isFinite(value)) return 0;
        const rounded = Math.round(value);
        return rounded < 0 ? 0 : rounded > 255 ? 255 : rounded;
    };

    let raw = hexColor.slice(1);

    // Expand shorthand forms
    if (raw.length === 3 || raw.length === 4) {
        raw = raw.split("").map((c) => c + c).join("");
    }

    const hasAlpha = raw.length === 8;
    const alphaHex = hasAlpha ? raw.slice(6, 8) : "";

    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);

    const p = clampUnit(Number(percentLighter));

    const adjust = (channel) => {
        if (p >= 0) return clampByte(channel + (255 - channel) * p);
        return clampByte(channel * (1 + p)); // p is negative => darken
    };

    const rr = adjust(r).toString(16).padStart(2, "0");
    const gg = adjust(g).toString(16).padStart(2, "0");
    const bb = adjust(b).toString(16).padStart(2, "0");

    return `#${rr}${gg}${bb}${alphaHex}`;
}

export function darkenHexColor(hexColor, percentDarker) {
    if (!/^#([0-9A-F]{3}){1,2}([0-9A-F]{2})?$/i.test(hexColor)) {
        console.warn('darkenHexColor: Invalid hex color format');
        return "#000000";
    }

    let color = hexColor.replace('#', '');

    if (color.length === 3) {
        color = color.split('').map(c => c + c).join('');
    }

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const newR = Math.max(0, r - r * percentDarker);
    const newG = Math.max(0, g - g * percentDarker);
    const newB = Math.max(0, b - b * percentDarker);

    const darkerHex = `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;

    if (color.length === 8) {
        const alpha = color.substring(6, 8);
        return darkerHex + alpha;
    }

    return darkerHex;
}

export function hslToRgba(h, s, l, alpha = 1) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // Achromatic (gray)
    } else {
        const hueToRgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        alpha,
    ];
}

// OKLCH --> sRGB (D65) conversion
// // Steps: OKLCH --> OKLab --> LMS' --> linear sRGB --> gamma sRGB
export function convertOklchToRgb(lightness, chroma, hueDegrees) {
    const hueRadians = (((hueDegrees % 360) + 360) % 360) * (Math.PI / 180);
    const labA = chroma * Math.cos(hueRadians);
    const labB = chroma * Math.sin(hueRadians);
    return convertOklabToSrgb(lightness, labA, labB);
}

// OKLCH utility
export function convertOklabToSrgb(lightness, labA, labB) {
    const lPrime = lightness + 0.3963377774 * labA + 0.2158037573 * labB;
    const mPrime = lightness - 0.1055613458 * labA - 0.0638541728 * labB;
    const sPrime = lightness - 0.0894841775 * labA - 1.291485548 * labB;
    const lCube = lPrime * lPrime * lPrime;
    const mCube = mPrime * mPrime * mPrime;
    const sCube = sPrime * sPrime * sPrime;
    let redLinear =
        +4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube;
    let greenLinear =
        -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube;
    let blueLinear =
        -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube;
    redLinear = clampToUnitInterval(redLinear);
    greenLinear = clampToUnitInterval(greenLinear);
    blueLinear = clampToUnitInterval(blueLinear);
    const red = srgbEncodeFromLinear(redLinear) * 255;
    const green = srgbEncodeFromLinear(greenLinear) * 255;
    const blue = srgbEncodeFromLinear(blueLinear) * 255;
    return [clampToByte(red), clampToByte(green), clampToByte(blue)];
}

export function colorFromValueWithMax({
    value,
    maxValue,
    baseColor,
    minimumLighten = 0.8,
    exponent = 1.1
}) {
    const numericValue = Number(value);
    const numericMax = Number(maxValue);

    if (!Number.isFinite(numericValue) || !Number.isFinite(numericMax) || numericMax <= 0) {
        return convertColorToHex(baseColor);
    }

    const normalized = clampToUnitInterval(numericValue / numericMax); // 0..1
    const inverted = 1 - normalized;
    const eased = Math.pow(inverted, exponent);

    const lightenAmount = clampToUnitInterval(minimumLighten * eased);

    const baseHexWithAlpha = convertColorToHex(baseColor);
    if (typeof baseHexWithAlpha !== "string") return baseHexWithAlpha;

    const baseHex = baseHexWithAlpha.slice(0, 7);
    return lightenHexColor(baseHex, lightenAmount);
}