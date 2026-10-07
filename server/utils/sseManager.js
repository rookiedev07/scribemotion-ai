class SSEManager {
  constructor() {
    this.clients = new Map(); // projectId -> Set of res objects
  }

  addClient(projectId, res) {
    if (!this.clients.has(projectId)) {
      this.clients.set(projectId, new Set());
    }

    const projectClients = this.clients.get(projectId);
    projectClients.add(res);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write(':\n\n'); // send initial comment to establish connection

    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (err) {
        clearInterval(heartbeatInterval);
      }
    }, 15000);

    res.on('close', () => {
      clearInterval(heartbeatInterval);
      projectClients.delete(res);
      if (projectClients.size === 0) {
        this.clients.delete(projectId);
      }
    });
  }

  sendEvent(projectId, eventName, data) {
    const projectClients = this.clients.get(projectId);
    if (!projectClients || projectClients.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const client of projectClients) {
      try {
        client.write(payload);
      } catch (err) {
        console.error(`Error sending SSE to client for project ${projectId}:`, err.message);
      }
    }
  }
}

export const sseManager = new SSEManager();
