import { GatewayOpcode, GatewayPayload, IdentifyPayload } from "./types";
import { validateBotToken } from "../auth/bot-auth";
import { prisma } from "../db/prisma";
import { dispatchGuildCreate } from "./dispatch";

/**
 * Handles incoming WebSocket messages for the Discord Gateway.
 * Note: This is an architectural stub for the actual WebSocket server implementation.
 */
export async function handleGatewayMessage(ws: any, payload: GatewayPayload) {
  const { op, d } = payload;

  switch (op) {
    case GatewayOpcode.Identify:
      const identify = d as IdentifyPayload;
      const userId = validateBotToken(identify.token);

      if (!userId) {
        ws.close(4004, "Authentication failed");
        return;
      }

      const bot = await prisma.user.findFirst({
        where: { id: userId, isBot: true, botToken: identify.token },
        include: { workspaceMemberships: { include: { workspace: { include: { channels: true } } } } }
      });

      if (!bot) {
        ws.close(4004, "Authentication failed");
        return;
      }

      // Ready Payload
      ws.send(JSON.stringify({
        op: GatewayOpcode.Dispatch,
        t: "READY",
        s: 1,
        d: {
          v: 10,
          user: {
            id: bot.id,
            username: bot.name,
            bot: true
          },
          guilds: bot.workspaceMemberships.map(m => ({ id: m.workspace.id, unavailable: false })),
          session_id: "fake_session_id"
        }
      }));

      // Immediately dispatch GUILD_CREATE for all bot workspaces
      let seq = 2;
      for (const membership of bot.workspaceMemberships) {
        dispatchGuildCreate(ws, membership.workspace, seq++);
      }
      break;

    case GatewayOpcode.Heartbeat:
      ws.send(JSON.stringify({
        op: GatewayOpcode.HeartbeatACK
      }));
      break;

    default:
      console.log("Unhandled Gateway Opcode:", op);
  }
}
