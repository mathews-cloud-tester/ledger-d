import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createInvoice, listInvoices, type ApiResponse } from "./invoices.ts";

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, response: ApiResponse): void {
  res.writeHead(response.status, { "content-type": "application/json" });
  res.end(JSON.stringify(response.body));
}

export async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === "POST" && req.url === "/invoices") {
    let body: unknown;
    try {
      body = await readJson(req);
    } catch {
      return send(res, { status: 400, body: { error: "invalid JSON" } });
    }
    return send(res, createInvoice(body));
  }
  if (req.method === "GET" && req.url === "/invoices") return send(res, listInvoices());
  if (req.method === "GET" && req.url === "/healthz") {
    return send(res, { status: 200, body: { ok: true, region: process.env.LEDGER_REGION ?? "unset" } });
  }
  send(res, { status: 404, body: { error: "not found" } });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8080);
  createServer((req, res) => void route(req, res)).listen(port, () => {
    console.log(`ledger-a listening on ${port} in region ${process.env.LEDGER_REGION ?? "unset"}`);
  });
}
