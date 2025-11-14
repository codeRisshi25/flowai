import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";

// --- Configuration ---
const app = express();
const PORT = 3001;
const UPLOADS_DIR = path.join(process.cwd(), "uploads"); // A stable path

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // temporary destination.
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // temporary, unique name
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Hello from FlowAI Receiver!");
});

/**
 * PHASE 1
 */
app.post("/upload-chunk", upload.single("chunk"), async (req, res) => {
  try {
    const { transferId, chunkIndex, orgFileName } = req.body;
    const tempFilePath = req.file.path;

    if (!transferId || !chunkIndex) {
      return res.status(400).send("Missing transferId or chunkIndex.");
    }

    //specific directory fortransfer :)
    const transferDir = path.join(UPLOADS_DIR, transferId);
    if (!fs.existsSync(transferDir)) {
      fs.mkdirSync(transferDir);
    }

    // final, permanent path for the chunk
    const finalChunkPath = path.join(transferDir, orgFileName.toString());

    //Move file from its temp location to the final path
    // Using fs.promises.rename for a modern async approach
    await fs.promises.rename(tempFilePath, finalChunkPath);

    console.log(`Received and saved: ${transferId}, chunk ${chunkIndex}`);

    res.status(200).send({
      message: "File successfully",
      transferId,
      chunkIndex,
    });
  } catch (error) {
    console.error("Error processing chunk:", error);
    res.status(500).send("Error saving chunk.");
  }
});

app.listen(PORT, () => {
  console.log(`[api-receiver] Server running at http://localhost:${PORT}`);
});
