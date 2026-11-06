import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/config", (req, res) => {
    const envKeys = Object.keys(process.env);
    
    // Search for any key that looks like a Gemini/API key
    const potentialKeys = envKeys.filter(k => 
      k.toUpperCase().includes("KEY") || 
      k.toUpperCase().includes("GEMINI") || 
      k.toUpperCase().includes("GOOGLE") ||
      k.toUpperCase().includes("TOKEN")
    );
    
    let finalKey = "";
    const isPlaceholder = (k?: string) => !k || k.includes("TODO") || k.includes("YOUR_API_KEY") || k.length < 10;

    // Priority order: GEMINI_API_KEY, then API_KEY, then others
    const priority = ["GEMINI_API_KEY", "API_KEY", "GOOGLE_API_KEY", "VITE_GEMINI_API_KEY"];
    
    for (const pKey of priority) {
      const val = process.env[pKey]?.trim();
      if (!isPlaceholder(val)) {
        finalKey = val!;
        break;
      }
    }

    // If still not found, search all potential keys
    if (!finalKey) {
      for (const k of potentialKeys) {
        const val = process.env[k]?.trim();
        if (!isPlaceholder(val)) {
          finalKey = val!;
          break;
        }
      }
    }

    // Final fallback: Search EVERY environment variable for a value starting with 'AIza'
    if (!finalKey) {
      for (const k of envKeys) {
        const val = process.env[k]?.trim();
        if (val && val.startsWith("AIza") && val.length > 20) {
          finalKey = val;
          break;
        }
      }
    }
    
    console.log(`[Config API] Request received. Final key found: ${!!finalKey}`);
    
    res.json({
      GEMINI_API_KEY: finalKey || "",
      debug: {
        keysFound: potentialKeys,
        hasKey: !!finalKey
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
