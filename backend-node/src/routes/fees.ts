// backend-node/src/routes/fees.ts
import type { Express, Request, Response } from "express";

type FeeLevel = {
  priorityMicroLamports: number;
  label: string;
};

type FeeSuggest = {
  slow: FeeLevel;
  normal: FeeLevel;
  fast: FeeLevel;
};

export function registerFeeSuggestRoutes(app: Express) {
  app.get("/fees/suggest", (req: Request, res: Response) => {
    const mult = Number(req.query.mult) || 1.0;
    
    const suggest: FeeSuggest = {
      slow: {
        priorityMicroLamports: Math.round(250 * mult),
        label: "Slow"
      },
      normal: {
        priorityMicroLamports: Math.round(1000 * mult),
        label: "Normal"
      },
      fast: {
        priorityMicroLamports: Math.round(2500 * mult),
        label: "Fast"
      }
    };
    
    res.json(suggest);
  });
}
      };
      res.json({ ok: true, suggest });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || "fee suggest failed" });
    }
  });
}
