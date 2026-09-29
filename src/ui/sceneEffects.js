const CUSTOM_FONT_FAMILIES = new Set([
    "Cinzel Decorative",
    "IM Fell English",
    "MedievalSharp",
    "Pixelify Sans",
]);

const styledScenes = new WeakSet();

export function applyFloatyText(scene) {
    if (styledScenes.has(scene)) return;

    const createText = scene.add.text.bind(scene.add);
    scene.add.text = (x, y, text, style = {}) => {
        const fontFamily = CUSTOM_FONT_FAMILIES.has(style.fontFamily)
            ? style.fontFamily
            : "MedievalSharp";

        return createText(x, y, text, { ...style, fontFamily }).setShadow(
            0,
            2,
            "rgba(10, 16, 32, 0.65)",
            3,
            true,
            true
        );
    };

    styledScenes.add(scene);
}

export function createSpriteShadow(scene, x, y, textureKey, scale) {
    const sourceImage = scene.textures.get(textureKey).getSourceImage();
    const displayWidth = sourceImage.width * scale;
    const displayHeight = sourceImage.height * scale;

    return scene.add.ellipse(
        x,
        y + displayHeight * 0.43,
        displayWidth * 0.56,
        Math.max(14, displayHeight * 0.075),
        0x060a13,
        0.38
    );
}