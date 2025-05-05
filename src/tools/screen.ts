import { Region as NutRegion, screen, FileType } from "@nut-tree-fork/nut-js";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { CaptureFormat, type Region as CustomRegion } from "../types.js";

let screenshotCounter = 0;
const MAX_SCREENSHOTS = 20;

async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

function getScreenshotPath(): string {
  const screenshotDir = path.join(os.tmpdir(), "total-pc-control-screenshots");
  return screenshotDir;
}

async function getActualScreenDimensions(): Promise<{
  width: number;
  height: number;
  scale: number;
}> {
  const baseWidth = await screen.width();
  const baseHeight = await screen.height();

  if (process.platform === "darwin") {
    try {
      const { execSync } = await import("node:child_process");
      const result = execSync(
        "system_profiler SPDisplaysDataType | grep Resolution"
      );
      const stdout = result.toString();

      const match = stdout.match(/Resolution: (\d+) x (\d+)/);
      if (match) {
        const actualWidth = Number.parseInt(match[1], 10);
        const actualHeight = Number.parseInt(match[2], 10);
        const scale = actualWidth / baseWidth;
        return { width: actualWidth, height: actualHeight, scale };
      }
    } catch (error) {
      console.warn("Failed to get Retina resolution:", error);
    }
  }

  return { width: baseWidth, height: baseHeight, scale: 1 };
}

/**
 * @param format - The format to save the image in (png or jpeg)
 * @returns Base64 encoded image data
 */
export async function captureScreen(
  format: CaptureFormat = CaptureFormat.PNG
): Promise<string> {
  let filepath = "";
  try {
    screenshotCounter = (screenshotCounter % MAX_SCREENSHOTS) + 1;
    const filename = `screenshot_${String(screenshotCounter).padStart(2, "0")}`;
    const screenshotDir = getScreenshotPath();
    await ensureDirectoryExists(screenshotDir);

    const width = await screen.width();
    const height = await screen.height();
    const fullScreenRegion = new NutRegion(0, 0, width, height);

    filepath = await screen.captureRegion(
      filename,
      fullScreenRegion,
      format === CaptureFormat.PNG ? FileType.PNG : FileType.JPG,
      screenshotDir
    );

    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString("base64");

    await fs.unlink(filepath);

    return `File saved as ${path.basename(
      filepath
    )}. Image data: data:image/${format};base64,${base64Image}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error capturing screen:", error);
    if (filepath) {
      try {
        await fs.unlink(filepath);
      } catch {}
    }
    throw new Error(`Failed to capture screen: ${errorMessage}`);
  }
}

/**
 * @param region - The region to capture (left, top, width, height)
 * @param format - The format to save the image in (png or jpeg)
 * @returns Base64 encoded image data
 */
export async function captureRegion(
  region: CustomRegion,
  format: CaptureFormat = CaptureFormat.PNG
): Promise<string> {
  let filepath = "";
  try {
    const {
      width: screenWidth,
      height: screenHeight,
      scale,
    } = await getActualScreenDimensions();

    const scaledRegion = {
      left: Math.round(region.left / scale),
      top: Math.round(region.top / scale),
      width: Math.round(region.width / scale),
      height: Math.round(region.height / scale),
    };

    if (scaledRegion.left < 0 || scaledRegion.top < 0) {
      throw new Error("Region coordinates cannot be negative");
    }
    if (scaledRegion.width <= 0 || scaledRegion.height <= 0) {
      throw new Error("Region dimensions must be positive");
    }
    if (scaledRegion.left + scaledRegion.width > (await screen.width())) {
      throw new Error(
        `Region width (${region.width}) at x=${region.left} exceeds screen width (${screenWidth}). ` +
          `Try using width <= ${screenWidth - region.left}.`
      );
    }
    if (scaledRegion.top + scaledRegion.height > (await screen.height())) {
      throw new Error(
        `Region height (${region.height}) at y=${region.top} exceeds screen height (${screenHeight}). ` +
          `Try using height <= ${screenHeight - region.top}.`
      );
    }

    screenshotCounter = (screenshotCounter % MAX_SCREENSHOTS) + 1;
    const filename = `screenshot_${String(screenshotCounter).padStart(2, "0")}`;
    const screenshotDir = getScreenshotPath();
    await ensureDirectoryExists(screenshotDir);

    const nutRegion = new NutRegion(
      scaledRegion.left,
      scaledRegion.top,
      scaledRegion.width,
      scaledRegion.height
    );

    filepath = await screen.captureRegion(
      filename,
      nutRegion,
      format === CaptureFormat.PNG ? FileType.PNG : FileType.JPG,
      screenshotDir
    );

    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString("base64");

    await fs.unlink(filepath);

    return `File saved as ${path.basename(
      filepath
    )}. Image data: data:image/${format};base64,${base64Image}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error capturing region:", error);
    if (filepath) {
      try {
        await fs.unlink(filepath);
      } catch {}
    }
    throw new Error(`Failed to capture screen region: ${errorMessage}`);
  }
}

/**
 * @returns The screen dimensions as width and height
 */
export async function getScreenSize(): Promise<{
  width: number;
  height: number;
}> {
  const width = await screen.width();
  const height = await screen.height();
  return { width, height };
}
