import { db } from "@/api/lib/data/db";
import { groupChatWS } from "@/api/lib/websocket/groupChat";

export function handleGroupChatWebSocket(ws: any, req: Request) {
  const url = new URL(req.url);
  const groupId = parseInt(url.searchParams.get("groupId") || "0");
  const userId = parseInt(url.searchParams.get("userId") || "0");
  const token = url.searchParams.get("token");

  if (!groupId || !userId || !token) {
    ws.close(1008, "Missing required parameters: groupId, userId, or token");
    return;
  }

  const user = db.query("SELECT id FROM account WHERE id = ?").get(userId);

  if (!user) {
    ws.close(1008, "Invalid user");
    return;
  }

  const isParticipant = db
    .query(
      `
      SELECT 1 FROM (
        SELECT lgm.lawyer_account as account FROM lawyer_group_members lgm WHERE lgm.group_id = ?
        UNION
        SELECT gr.requester_account as account FROM group_requests gr 
        WHERE gr.group_id = ? AND gr.status = 'accepted'
      ) participants WHERE account = ?
    `
    )
    .get(groupId, groupId, userId);

  if (!isParticipant) {
    ws.close(1008, "Not authorized to join this group chat");
    return;
  }

  const connectionId = `${userId}-${groupId}-${Date.now()}`;

  groupChatWS.addConnection(connectionId, ws, userId, groupId);

  ws.send(
    JSON.stringify({
      type: "connection_established",
      groupId,
      userId,
      connectionId,
      message:
        "Successfully connected to group chat. You will receive notifications when new messages are posted.",
    })
  );

  ws.data = { connectionId, groupId, userId };
}

export function handleWebSocketMessage(ws: any, message: string | Buffer) {
  try {
    const data = JSON.parse(message.toString());

    if (data.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
}

export function handleWebSocketClose(ws: any) {
  if (ws.data?.connectionId) {
    groupChatWS.removeConnection(ws.data.connectionId);
  }
}
