import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import https from "https";
import { URL } from "url";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely, but lazy-load calls so missing key doesn't crash server immediately
let aiClient: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
};

// API routes FIRST

// Text-to-Speech API Proxy for Cloud Vietnamese Female Voice
app.get("/api/tts", async (req, res) => {
  try {
    const text = req.query.text as string;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "Tham số văn bản 'text' là bắt buộc" });
      return;
    }

    const ttsUrl = new URL("https://translate.google.com/translate_tts");
    ttsUrl.searchParams.append("ie", "UTF-8");
    ttsUrl.searchParams.append("tl", "vi");
    ttsUrl.searchParams.append("client", "tw-ob");
    ttsUrl.searchParams.append("q", text.slice(0, 200));

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache audio results for performance

    const googleReq = https.get(ttsUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
      }
    }, (googleRes) => {
      if (googleRes.statusCode && googleRes.statusCode >= 400) {
        console.error(`Google TTS returned status code: ${googleRes.statusCode}`);
        res.status(googleRes.statusCode).end();
        return;
      }
      googleRes.pipe(res);
    });

    googleReq.on("error", (err) => {
      console.error("Lỗi yêu cầu TTS của khách:", err);
      res.status(500).json({ error: "Không thể khởi tạo luồng giọng đọc." });
    });
  } catch (error: any) {
    console.error("Lỗi API TTS:", error);
    res.status(500).json({ error: error.message || "Lỗi máy chủ nội bộ" });
  }
});
// Gemini API Enhance Route Removed

// Vite middleware flow
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start Vite server:", err);
});
