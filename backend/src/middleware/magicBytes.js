import fs from "fs";

// Known magic byte signatures for allowed image types
const MAGIC_BYTES = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [
    // WEBP is a RIFF container: "RIFF" (4 bytes) + size (4 bytes) + "WEBP" (4 bytes)
    [0x52, 0x49, 0x46, 0x46], // We will check first 4
  ],
  "image/tiff": [
    [0x49, 0x49, 0x2a, 0x00], // Little endian
    [0x4d, 0x4d, 0x00, 0x2a], // Big endian
  ],
};

/**
 * Express middleware to check the file's magic bytes against its MIME type.
 * Should be placed after multer processes the upload.
 */
export async function verifyMagicBytes(req, res, next) {
  if (!req.file) return next(); // No file to verify

  const file = req.file;
  const expectedSignatures = MAGIC_BYTES[file.mimetype];
  
  if (!expectedSignatures) {
    fs.unlink(file.path, () => {}); // cleanup
    return res.status(400).json({ error: `Cannot verify magic bytes for ${file.mimetype}` });
  }

  try {
    const handle = await fs.promises.open(file.path, "r");
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    await handle.close();

    let matched = false;
    for (const sig of expectedSignatures) {
      let isMatch = true;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) {
          isMatch = false;
          break;
        }
      }
      
      // Special check for WEBP: bytes 8-11 must be "WEBP" (0x57, 0x45, 0x42, 0x50)
      if (isMatch && file.mimetype === "image/webp") {
        if (buffer[8] !== 0x57 || buffer[9] !== 0x45 || buffer[10] !== 0x42 || buffer[11] !== 0x50) {
          isMatch = false;
        }
      }

      if (isMatch) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      fs.unlink(file.path, () => {}); // cleanup spoofed file
      return res.status(400).json({ error: "File content does not match its MIME type (possible spoofing)." });
    }

    next();
  } catch (err) {
    fs.unlink(file.path, () => {});
    return res.status(500).json({ error: "Failed to read file for security verification." });
  }
}
