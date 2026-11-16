import { ImageSegmenterResult } from '@mediapipe/tasks-vision';
import { createCopyTextureToCanvas, tasksCanvas, toImageBitmap } from '../third-party/convertMPMaskToImageBitmap';

type VirtualBackgroundOptions = {
    blurRadius: number;
}

export const defaultOptions: VirtualBackgroundOptions = {
    blurRadius: 6,
}

// The slider level (3-10) is not used as a pixel radius directly. Each level
// is multiplied by this factor and then scaled with the camera resolution
// (relative to a 480p frame), so a level looks equally strong on a 480p and
// on a 1080p camera instead of fading away as the resolution grows.
const BLUR_PX_PER_LEVEL = 2.5;
const BLUR_REFERENCE_HEIGHT = 480;

// The background is blurred on a canvas this much smaller than the camera
// frame. A blurred image carries no fine detail, so the result looks the
// same while the (much larger) blur gets cheaper than before.
const BLUR_DOWNSCALE = 0.5;

export const renderOptions = (virtualBackgroundOptions: JQuery<HTMLElement>, data: Record<string, any>) => {
    const template = `
    <div class="form-group">
        <label for="blurRadius">{{localize 'AVQOL.VirtualBackgroundBlurBackgroundRadius'}}</label>
        {{rangePicker name="virtualBackgroundOptions.blurRadius" value=(lookup this 'virtualBackgroundOptions.blurRadius') min=3 max=10 step=1}}
    </div>`
    virtualBackgroundOptions.append(Handlebars.compile(template)(data));
}


const safariBlurBackground = (context, blurRadius = 8) => {
    /**
     * Applies blur to the canvas image
     * An implementation for fallback for safari that does not support the filter property,
     * which is not practical because it is very slow.
     * @param context: 2d canvas context
     */
    const { height, width } = context.canvas
    const imageData = context.getImageData(0, 0, width, height)
    const videoPixels = imageData.data

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // get the pixel index
            const i = (y * width + x) * 4;
            // we get the average color of the neighboring pixels and set it to the current pixel
            let r = 0, g = 0, b = 0, a = 0;
            let pixelCount = 0;
            // we loop through the neighboring pixels
            for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                    let nx = x + dx;
                    let ny = y + dy;
                    // Check if the neighboring pixel is within the bounds of the image
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        let offset = (ny * width + nx) * 4;
                        r += videoPixels[offset];
                        g += videoPixels[offset + 1];
                        b += videoPixels[offset + 2];
                        a += videoPixels[offset + 3];
                        pixelCount++;
                    }
                }
            }

            // Compute the average color of the neighboring pixels
            let avgR = r / pixelCount;
            let avgG = g / pixelCount;
            let avgB = b / pixelCount;
            let avgA = a / pixelCount;

            // Write the blurred pixel to the video canvas
            videoPixels[i] = avgR;
            videoPixels[i + 1] = avgG;
            videoPixels[i + 2] = avgB;
            videoPixels[i + 3] = avgA;
        }
    }

    context.putImageData(imageData, 0, 0)
}

export default (canvas: HTMLCanvasElement, options: VirtualBackgroundOptions) => {
    const ctx = canvas.getContext("2d");
    // Reused across frames instead of allocating a canvas per frame.
    const blurBackgroundCanvas = document.createElement('canvas');
    const blurBackgroundCtx = blurBackgroundCanvas.getContext('2d');
    // The value arrives as a string when it comes straight from the slider.
    const blurLevel = Number(options.blurRadius) || defaultOptions.blurRadius;
    return async (results: ImageSegmenterResult, input: ImageBitmap, video: HTMLVideoElement) => {
        // get the canvas dimensions
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // calculate the scale of the video to fit the canvas
        const scaleX = canvasWidth / videoWidth;
        const scaleY = canvasHeight / videoHeight;
        const scale = Math.min(scaleX, scaleY);

        // The scale is defined for the video width and height
        const scaledWidth = videoWidth * scale;
        const scaledHeight = videoHeight * scale;

        // calculate the offset to center the video on the canvas
        const offsetX = (canvasWidth - scaledWidth) / 2;
        const offsetY = (canvasHeight - scaledHeight) / 2;

        ctx.save();
        ctx.fillStyle = 'white'
        ctx.clearRect(offsetX, offsetY, scaledWidth, scaledHeight)

        // // draw the mask image on the canvas
        const segmentationMask = results.confidenceMasks[0];
        const segmentationMaskBitmap = await toImageBitmap(segmentationMask);
        // ctx.translate(canvasWidth, 0);
        // ctx.scale(-1, 1);
        ctx.drawImage(segmentationMaskBitmap, offsetX, offsetY, scaledWidth, scaledHeight);
        ctx.restore();

        ctx.save();

        const blurWidth = Math.max(1, Math.round(videoWidth * BLUR_DOWNSCALE));
        const blurHeight = Math.max(1, Math.round(videoHeight * BLUR_DOWNSCALE));
        if (blurBackgroundCanvas.width !== blurWidth || blurBackgroundCanvas.height !== blurHeight) {
            blurBackgroundCanvas.width = blurWidth;
            blurBackgroundCanvas.height = blurHeight;
        }
        if (blurBackgroundCtx.filter) {
            // Blur radius in pixels of the full camera frame, then of the
            // downscaled canvas it is actually applied on.
            const blurPx = blurLevel * BLUR_PX_PER_LEVEL * (videoHeight / BLUR_REFERENCE_HEIGHT);
            const scaledBlurPx = blurPx * BLUR_DOWNSCALE;
            // A canvas blur mixes the pixels near the border with the
            // transparent area outside of it, which shows up as a dark
            // vignette - more so the stronger the blur. Drawing the frame
            // slightly oversized pushes that faded band off-canvas.
            const overscan = scaledBlurPx * 2;
            blurBackgroundCtx.filter = `blur(${scaledBlurPx}px)`
            blurBackgroundCtx.drawImage(
                input,
                -overscan,
                -overscan,
                blurWidth + overscan * 2,
                blurHeight + overscan * 2
            )
        } else {
            // Safari does not supported for filter property. This fallback
            // costs O(radius^2) per pixel, so it keeps the raw slider level
            // as its radius (on the downscaled canvas).
            blurBackgroundCtx.drawImage(input, 0, 0, blurWidth, blurHeight)
            safariBlurBackground(blurBackgroundCtx, blurLevel)
        }

        // draw the blur background on the canvas
        ctx.globalCompositeOperation = 'source-out'
        ctx.drawImage(blurBackgroundCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
        ctx.restore();

        ctx.globalCompositeOperation = 'destination-atop'
        ctx.drawImage(input, offsetX, offsetY, scaledWidth, scaledHeight);
        ctx.restore();
    };
}
