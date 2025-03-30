import { screen, Region as NutRegion } from "@nut-tree-fork/nut-js"; // Import library's Region as NutRegion
import { CaptureFormat, Region as CustomRegion } from "../types.js"; // Import custom Region as CustomRegion
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import * as os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Counter for rotating screenshots
let screenshotCounter = 0;
const MAX_SCREENSHOTS = 20;

// Removed SCREENSHOTS_DIR and ensureScreenshotDir

/**
 * Captures the entire screen and returns the image as a base64 string
 * @param format - The format to save the image in (png or jpeg)
 * @returns Base64 encoded image data
 */
export async function captureScreen(format: CaptureFormat = CaptureFormat.PNG): Promise<string> {
  let filepath = ""; // Define filepath outside try for cleanup
  try {
    // Generate a rotating filename in the project root
    screenshotCounter = (screenshotCounter % MAX_SCREENSHOTS) + 1;
    const filename = `screenshot_${String(screenshotCounter).padStart(2, '0')}.${format}`;
    // Use project root (CWD) for the path
    filepath = path.resolve(filename); // Use resolve to get absolute path in CWD
    
    // Capture the screen
    const width = await screen.width(); // Await the width
    const height = await screen.height(); // Await the height
    const fullScreenRegion = new NutRegion(0, 0, width, height); // Create NutRegion instance
    await screen.captureRegion(filepath, fullScreenRegion); // Pass NutRegion instance
    
    // Read the file and convert to base64
    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString("base64");
    
    // Clean up the file - REMOVED fs.unlink(filepath);
    
    // Return the base64 image along with the filename for context
    return `File saved as ${filename}. Image data: data:image/${format};base64,${base64Image}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error capturing screen:", error);
    // Attempt cleanup if filepath was set
    if (filepath) {
      try { await fs.unlink(filepath); } catch (cleanupError) { console.error("Screenshot cleanup failed:", cleanupError); }
    }
    // Re-throw error with original message
    throw new Error(`Failed to capture screen: ${errorMessage}`);
  }
}

/**
 * Captures a region of the screen and returns the image as a base64 string
 * @param region - The region to capture (left, top, width, height)
 * @param format - The format to save the image in (png or jpeg)
 * @returns Base64 encoded image data
 */
export async function captureRegion(region: CustomRegion, format: CaptureFormat = CaptureFormat.PNG): Promise<string> { // Use CustomRegion for parameter type
  let filepath = ""; // Define filepath outside try for cleanup
  try {
    // Generate a rotating filename in the project root
    screenshotCounter = (screenshotCounter % MAX_SCREENSHOTS) + 1;
    const filename = `screenshot_${String(screenshotCounter).padStart(2, '0')}.${format}`;
    // Use project root (CWD) for the path
    filepath = path.resolve(filename); // Use resolve to get absolute path in CWD
    
    // Capture the region
    const nutRegion = new NutRegion(region.left, region.top, region.width, region.height); // Create NutRegion instance from CustomRegion
    await screen.captureRegion(filepath, nutRegion); // Pass NutRegion instance
    
    // Read the file and convert to base64
    const imageBuffer = await fs.readFile(filepath);
    const base64Image = imageBuffer.toString("base64");
    
    // Clean up the file - REMOVED fs.unlink(filepath);
    
    // Return the base64 image along with the filename for context
    return `File saved as ${filename}. Image data: data:image/${format};base64,${base64Image}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error capturing region:", error);
     // Attempt cleanup if filepath was set
    if (filepath) {
      try { await fs.unlink(filepath); } catch (cleanupError) { console.error("Screenshot cleanup failed:", cleanupError); }
    }
    // Re-throw error with original message
    throw new Error(`Failed to capture screen region: ${errorMessage}`);
  }
}

/**
 * Gets the screen dimensions
 * @returns The screen dimensions as width and height
 */
export async function getScreenSize(): Promise<{ width: number; height: number }> {
  const width = await screen.width(); // Await the width
  const height = await screen.height(); // Await the height
  return {
    width: width,
    height: height
  };
}