// backend-node/src/routes/presets.ts
import type { Express, Request, Response } from "express";

/**
 * Base64url encode/decode utilities
 */
function encodeBase64Url(obj: any): string {
  try {
    const json = JSON.stringify(obj);
    const b64 = Buffer.from(json, 'utf8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

function decodeBase64Url(code: string): any | null {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function registerPresetsRoutes(app: Express) {
  // Encode query params to base64url
  app.get("/presets/encode", (req: Request, res: Response) => {
    try {
      const params = { ...req.query };
      if (Object.keys(params).length === 0) {
        return res.status(400).json({ error: "no query params provided" });
      }
      
      const code = encodeBase64Url(params);
      res.json({ code });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "encoding failed" });
    }
  });

  // Decode base64url to JSON
  app.get("/presets/decode/:code", (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      if (!code) return res.status(400).json({ error: "code required" });
      
      const decoded = decodeBase64Url(code);
      if (!decoded) {
        return res.status(400).json({ error: "invalid code" });
      }
      
      res.json(decoded);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "decoding failed" });
    }
  });
}
