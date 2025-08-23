import hono from "./api";
import { db, runMigrations, initializeDatabase } from "./api/lib/data/db";
import { startRequestExpirationJob } from "./api/lib/utils/requestJobs";
import {
  handleGroupChatWebSocket,
  handleWebSocketMessage,
  handleWebSocketClose,
} from "./api/lib/websocket/handler";
import html from "./src/index.html";

await initializeDatabase();
await runMigrations();

startRequestExpirationJob();

const server = Bun.serve({
  development: {
    hmr: true,
    console: true,
  },

  idleTimeout: 60,

  routes: {
    "/api": new Response(
      JSON.stringify({
        message: "Bun Server",
        version: "v1.0.0",
      })
    ),
    "/api/v1/*": (req) => {
      return hono.fetch(req);
    },

    "/static/*": (req) => {
      const url = new URL(req.url);
      const filePath = url.pathname.replace("/static/", "");
      const file = Bun.file(`public/${filePath}`);
      return new Response(file);
    },

    "/*": html,
  },

  websocket: {
    open(ws) {
      const req = ws.data as Request;
      const url = new URL(req.url);
      if (url.pathname === "/ws/group-chat") {
        handleGroupChatWebSocket(ws, req);
      }
    },
    message(ws, message) {
      handleWebSocketMessage(ws, message);
    },
    close(ws) {
      handleWebSocketClose(ws);
    },
  },

  fetch(req) {
    const url = new URL(req.url);

    if (
      url.pathname === "/ws/group-chat" &&
      req.headers.get("upgrade") === "websocket"
    ) {
      const success = server.upgrade(req, {
        data: req,
      });
      if (success) {
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    if (req.url.includes("/api/v1")) {
      return hono.fetch(req);
    }

    if (req.url.includes("/static/")) {
      const url = new URL(req.url);
      const filePath = url.pathname.replace("/static/", "");
      const file = Bun.file(`public/${filePath}`);
      return new Response(file);
    }

    return new Response("Not Found", { status: 404 });
  },

  error(error) {
    console.error(error);
    return new Response(`Internal Error: ${error.message}`, { status: 500 });
  },
});

console.log(`Dev server running at ${server.url} 🚀`);
console.log(`BUN VERSION: ${Bun.version}`);
