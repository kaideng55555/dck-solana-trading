// backend-node/src/lib/notify.ts
import https from "https";

type ArtItem = {
  id: string;
  title: string;
  artist: string;
  email?: string;
  type: "image" | "audio" | "video" | "other";
  src: string;
  thumb?: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
  description?: string;
};

function postJSON(url: string, payload: any): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const body = Buffer.from(JSON.stringify(payload));
      const req = https.request(
        {
          method: "POST",
          hostname: u.hostname,
          path: u.pathname + (u.search || ""),
          port: u.port || (u.protocol === "https:" ? 443 : 80),
          headers: {
            "content-type": "application/json",
            "content-length": body.length
          }
        },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve());
        }
      );
      req.on("error", (e) => reject(e));
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

function absUrl(pathOrUrl: string): string {
  try {
    // already a full URL?
    new URL(pathOrUrl);
    return pathOrUrl;
  } catch {}
  const base = process.env.PUBLIC_BASE_URL || "";
  if (!base) return pathOrUrl; // will likely fail to preview on Telegram/Discord
  return base.replace(/\/$/, "") + (pathOrUrl.startsWith("/") ? pathOrUrl : "/" + pathOrUrl);
}

export async function notifyNewArt(item: ArtItem, ev: "submitted" | "approved" = "submitted") {
  const tgBot = process.env.TELEGRAM_BOT_TOKEN || "";
  const tgChat = process.env.TELEGRAM_CHAT_ID || "";
  const disc = process.env.DISCORD_WEBHOOK_URL || "";

  const title = ev === "approved" ? "✅ Approved Artwork" : "🆕 New Submission";
  const imageUrl = item.thumb ? absUrl(item.thumb) : (item.type === "image" ? absUrl(item.src) : "");
  const mediaUrl = absUrl(item.src);
  const caption =
    `${title}\n` +
    `• Title: ${item.title}\n` +
    `• Artist: ${item.artist}${item.email ? " (" + item.email + ")" : ""}\n` +
    `• Type: ${item.type}\n` +
    (item.description ? `\n${(item.description || "").slice(0, 400)}` : "");

  // Telegram rich: prefer sendPhoto if we have an image URL; else fallback to sendMessage
  if (tgBot && tgChat) {
    if (imageUrl) {
      const tgUrl = `https://api.telegram.org/bot${tgBot}/sendPhoto`;
      await postJSON(tgUrl, {
        chat_id: tgChat,
        photo: imageUrl,
        caption,
        parse_mode: "HTML" // (we didn't add HTML markup, safe to keep)
      });
    } else {
      const tgUrl = `https://api.telegram.org/bot${tgBot}/sendMessage`;
      const text = caption + (mediaUrl ? `\n\n${mediaUrl}` : "");
      await postJSON(tgUrl, { chat_id: tgChat, text, disable_web_page_preview: false });
    }
  }

  // Discord rich embed
  if (disc) {
    const embed: any = {
      title,
      description: `**${item.title}** — ${item.artist}${item.email ? " (" + item.email + ")" : ""}`,
      url: mediaUrl,
      color: ev === "approved" ? 0x57F287 : 0x5865F2, // green / blurple
      fields: item.description ? [{ name: "Notes", value: (item.description || "").slice(0, 1000) }] : []
    };
    if (imageUrl) {
      embed.image = { url: imageUrl };
      embed.thumbnail = { url: imageUrl };
    }
    await postJSON(disc, { embeds: [embed] });
  }
}
