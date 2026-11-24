/*
 * SEWA design reminder: live state is visible, failure is reversible, and demo mode is
 * explicitly labeled. The transport never blocks the clinical UI while reconnecting.
 */
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
export type TransportState = "live" | "connecting" | "offline" | "demo";

type Listener = (payload: unknown) => void;
type StateListener = (state: TransportState) => void;

class ClinicalTransport {
  private client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription>();
  private listeners = new Map<string, Set<Listener>>();
  private stateListeners = new Set<StateListener>();
  private token: string | null = null;
  private state: TransportState = "offline";

  getState() {
    return this.state;
  }

  private setState(state: TransportState) {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  onState(listener: StateListener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  async connect(token?: string | null) {
    const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;
    if (!wsUrl) {
      this.setState("demo");
      return;
    }
    if (this.client?.active) return;
    this.token = token ?? null;
    this.setState("connecting");
    let webSocketFactory: (() => WebSocket) | undefined;
    if (wsUrl.startsWith("ws")) {
      webSocketFactory = () => new WebSocket(wsUrl);
    } else {
      // sockjs-client still references the Node-style `global` symbol in one
      // browser utility. Define the browser equivalent before loading it so a
      // configured Spring SockJS endpoint cannot blank the entire dashboard.
      const browserGlobal = globalThis as typeof globalThis & { global?: typeof globalThis };
      browserGlobal.global ??= globalThis;
      const { default: SockJS } = await import("sockjs-client");
      webSocketFactory = () => new SockJS(wsUrl) as unknown as WebSocket;
    }
    this.client = new Client({
      webSocketFactory,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.setState("live");
        this.listeners.forEach((_callbacks, topic) => this.subscribe(topic));
      },
      onDisconnect: () => {
        this.setState("offline");
      },
      onWebSocketClose: () => {
        if (this.state !== "demo") this.setState("offline");
      },
      onStompError: () => {
        this.setState("offline");
      },
    });
    this.client.activate();
  }

  disconnect() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.client = null;
    this.setState("offline");
  }

  subscribe(topic: string, callback?: Listener) {
    if (callback) {
      if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
      this.listeners.get(topic)?.add(callback);
    }
    if (!this.client?.connected || this.subscriptions.has(topic)) return;
    this.subscriptions.set(
      topic,
      this.client.subscribe(topic, (message: IMessage) => {
        if (!message.body) return;
        try {
          const payload = JSON.parse(message.body);
          this.listeners.get(topic)?.forEach((listener) => listener(payload));
        } catch {
          // Ignore malformed messages without taking down the monitoring view.
        }
      }),
    );
  }

  unsubscribe(topic: string, callback?: Listener) {
    if (callback) this.listeners.get(topic)?.delete(callback);
    if (!callback || this.listeners.get(topic)?.size === 0) {
      this.subscriptions.get(topic)?.unsubscribe();
      this.subscriptions.delete(topic);
      if (!this.listeners.get(topic)?.size) this.listeners.delete(topic);
    }
  }
}

export const clinicalTransport = new ClinicalTransport();
