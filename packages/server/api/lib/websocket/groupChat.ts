interface GroupConnection {
  ws: any;
  userId: number;
  groupId: number;
}

class GroupChatWebSocketManager {
  private connections = new Map<string, GroupConnection>();
  
  addConnection(connectionId: string, ws: any, userId: number, groupId: number) {
    this.connections.set(connectionId, { ws, userId, groupId });
  }

  removeConnection(connectionId: string) {
    this.connections.delete(connectionId);
  }

  notifyGroup(groupId: number, message: any) {
    for (const [connectionId, connection] of this.connections) {
      if (connection.groupId === groupId) {
        try {
          connection.ws.send(JSON.stringify({
            type: "group_message_update",
            groupId,
            data: message
          }));
        } catch (error) {
          console.error(`Failed to send message to connection ${connectionId}:`, error);
          this.connections.delete(connectionId);
        }
      }
    }
  }

  getGroupConnections(groupId: number): GroupConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.groupId === groupId
    );
  }
}

export const groupChatWS = new GroupChatWebSocketManager();
