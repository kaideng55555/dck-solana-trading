import type { Response } from 'express';

/**
 * SSE Helper utilities
 */

/**
 * Set SSE headers on response
 */
export function setSseHeaders(res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
}

/**
 * Write SSE event to response
 */
export function writeEvent(res: Response, id: string | number, data: any) {
  res.write(`id: ${id}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Write SSE comment (heartbeat)
 */
export function writeComment(res: Response, comment: string) {
  res.write(`: ${comment}\n\n`);
}
