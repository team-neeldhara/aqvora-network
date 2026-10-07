let socket = null;
let reconnectTimer = null;
let manuallyClosed = false;

const WS_URL = import.meta.env.VITE_WS_URL;

export function connectGovernmentWebSocket(callbacks = {}) {
  manuallyClosed = false;

  // Already connected
  if (socket?.readyState === WebSocket.OPEN) {
    return socket;
  }

  // Check whether the environment variable exists
  if (!WS_URL) {
    const error = new Error(
      "VITE_WS_URL is not defined. Check your .env file."
    );

    console.error("Government WebSocket:", error);
    callbacks.onError?.(error);

    scheduleReconnect(callbacks);
    return null;
  }

  console.log("Connecting to Government WebSocket:", WS_URL);

  try {
    socket = new WebSocket(WS_URL);
  } catch (error) {
    console.error("Failed to create WebSocket:", error);

    callbacks.onError?.(error);
    scheduleReconnect(callbacks);

    return null;
  }

  // -------------------------
  // CONNECTION SUCCESS
  // -------------------------
  socket.onopen = () => {
    console.log("Government WebSocket CONNECTED");

    callbacks.onOpen?.();
  };

  // -------------------------
  // MESSAGE RECEIVED
  // -------------------------
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      console.log("Government WebSocket message:", data);

      callbacks.onMessage?.(data);
    } catch (error) {
      console.error(
        "Government WebSocket received invalid JSON:",
        event.data
      );

      callbacks.onError?.(error);
    }
  };

  // -------------------------
  // ERROR
  // -------------------------
  socket.onerror = (event) => {
    console.error("Government WebSocket ERROR:", event);

    callbacks.onError?.(event);
  };

  // -------------------------
  // CONNECTION CLOSED
  // -------------------------
  socket.onclose = (event) => {
    console.warn(
      "Government WebSocket CLOSED.",
      "Code:",
      event.code,
      "Reason:",
      event.reason || "No reason provided"
    );

    socket = null;

    callbacks.onClose?.(event);

    // Automatically reconnect unless
    // the application intentionally closed it
    if (!manuallyClosed) {
      scheduleReconnect(callbacks);
    }
  };

  return socket;
}

// -------------------------
// RECONNECT
// -------------------------
function scheduleReconnect(callbacks) {
  if (reconnectTimer || manuallyClosed) {
    return;
  }

  console.log("WebSocket reconnecting in 5 seconds...");

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    connectGovernmentWebSocket(callbacks);
  }, 5000);
}

// -------------------------
// DISCONNECT
// -------------------------
export function disconnectGovernmentWebSocket() {
  console.log("Manually closing Government WebSocket.");

  manuallyClosed = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}