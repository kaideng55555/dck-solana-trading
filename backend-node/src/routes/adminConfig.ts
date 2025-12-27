// backend-node/src/routes/adminConfig.ts
import type { Express, Request, Response } from "express";
import { getRuntimeConfig, saveRuntimeConfig, parseWalletList, loadRuntimeConfig } from "../lib/runtimeConfig";
import { getFeeConfig } from "../lib/feeConfig.js";

function adminAuth(req: Request, res: Response, next: Function){
  const token = req.header("x-admin-token") || "";
  if (!process.env.ADMIN_TOKEN) return res.status(500).json({ ok:false, error:"ADMIN_TOKEN not configured" });
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ ok:false, error:"unauthorized" });
  next();
}

export function registerAdminConfigRoutes(app: Express){
  loadRuntimeConfig();

  app.get("/admin/config", adminAuth, (req: Request, res: Response) => {
    const cfg = getRuntimeConfig();
    res.json({ ok:true, config: {
      ...cfg,
      ALLOWED_WALLETS_LIST: parseWalletList(cfg.ALLOWED_WALLETS),
    }});
  });

  app.post("/admin/config", adminAuth, (req: Request, res: Response) => {
    const patch = req.body || {};
    const normalized: any = {};
    if (patch.TRADING_PUBLIC !== undefined) normalized.TRADING_PUBLIC = String(patch.TRADING_PUBLIC === "1" || patch.TRADING_PUBLIC === 1 || patch.TRADING_PUBLIC === true ? "1":"0");
    if (patch.ALLOWED_WALLETS !== undefined) normalized.ALLOWED_WALLETS = String(patch.ALLOWED_WALLETS);
    if (Array.isArray(patch.ALLOWED_WALLETS_LIST)) normalized.ALLOWED_WALLETS = patch.ALLOWED_WALLETS_LIST.join(",");
    if (patch.MIN_LIQ_USD !== undefined) normalized.MIN_LIQ_USD = String(patch.MIN_LIQ_USD);
    if (patch.MIN_TOKEN_AGE_MINUTES !== undefined) normalized.MIN_TOKEN_AGE_MINUTES = String(patch.MIN_TOKEN_AGE_MINUTES);
    if (patch.MAX_TAX_PCT !== undefined) normalized.MAX_TAX_PCT = String(patch.MAX_TAX_PCT);
    if (patch.MIN_RISK_SCORE !== undefined) normalized.MIN_RISK_SCORE = String(patch.MIN_RISK_SCORE);

    const saved = saveRuntimeConfig(normalized);
    res.json({ ok:true, saved });
  });

  app.get("/admin/wallets", adminAuth, (req: Request, res: Response) => {
    const cfg = getRuntimeConfig();
    res.json({ ok:true, wallets: parseWalletList(cfg.ALLOWED_WALLETS) });
  });

  app.post("/admin/wallets/add", adminAuth, (req: Request, res: Response) => {
    const w = (req.body?.wallet || "").trim();
    if (!w) return res.status(400).json({ ok:false, error:"wallet required" });
    const cfg = getRuntimeConfig();
    const list = new Set(parseWalletList(cfg.ALLOWED_WALLETS));
    list.add(w);
    const saved = saveRuntimeConfig({ ALLOWED_WALLETS: Array.from(list).join(",") });
    res.json({ ok:true, saved });
  });

  app.post("/admin/wallets/remove", adminAuth, (req: Request, res: Response) => {
    const w = (req.body?.wallet || "").trim();
    if (!w) return res.status(400).json({ ok:false, error:"wallet required" });
    const cfg = getRuntimeConfig();
    const list = new Set(parseWalletList(cfg.ALLOWED_WALLETS));
    list.delete(w);
    const saved = saveRuntimeConfig({ ALLOWED_WALLETS: Array.from(list).join(",") });
    res.json({ ok:true, saved });
  });

  // GET /admin/fees - View fee configuration
  app.get("/admin/fees", adminAuth, (req: Request, res: Response) => {
    const feeConfig = getFeeConfig();
    res.json({
      ok: true,
      fees: {
        wallet: feeConfig.feeWallet,
        percentage: feeConfig.feePercentage,
        enabled: feeConfig.enabled,
      },
    });
  });
}
