import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  constructor() {
    this.client = null;
    this.subscriptions = {};
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
  }

  connect(token) {
    if (this.client && this.client.active) return;

    this.client = new Client({
      webSocketFactory: () => {
        const socket = new SockJS(WS_URL);
        socket.transports = ['websocket'];
        return socket;
      },
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('STOMP: Connected successfully');
        this.onConnectCallbacks.forEach(cb => cb());
      },
      onDisconnect: () => {
        console.log('STOMP: Disconnected');
        this.onDisconnectCallbacks.forEach(cb => cb());
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      }
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.subscriptions = {};
    }
  }

  subscribe(topic, callback) {
    if (!this.client || !this.client.connected) {
      console.warn('STOMP: Cannot subscribe, client not connected');
      return null;
    }

    if (this.subscriptions[topic]) {
      return this.subscriptions[topic];
    }

    const subscription = this.client.subscribe(topic, (message) => {
      if (message.body) {
        callback(JSON.parse(message.body));
      }
    });

    this.subscriptions[topic] = subscription;
    return subscription;
  }

  unsubscribe(topic) {
    if (this.subscriptions[topic]) {
      this.subscriptions[topic].unsubscribe();
      delete this.subscriptions[topic];
    }
  }

  onConnect(callback) {
    this.onConnectCallbacks.push(callback);
  }

  onDisconnect(callback) {
    this.onDisconnectCallbacks.push(callback);
  }

  isConnected() {
    return this.client && this.client.connected;
  }
}

export const websocketService = new WebSocketService();
