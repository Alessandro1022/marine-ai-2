// Connects to onboard marine electronics (Garmin, Raymarine, Simrad/Navico,
// Lowrance, B&G and any NMEA 2000/0183 network) through a SignalK gateway on
// the boat's WiFi (e.g. Yacht Devices YDWG-02, Raspberry Pi SignalK server,
// or chartplotters with SignalK support).
//
// Note: connecting to a local ws:// gateway from an https PWA is blocked by
// browsers (mixed content). Live telemetry works in the wrapped native app
// (WKWebView/WebView allows it) or when the gateway exposes wss://.

export interface Telemetry {
  speedOverGroundKn: number | null;
  courseOverGroundDeg: number | null;
  depthM: number | null;
  windSpeedApparentMs: number | null;
  headingDeg: number | null;
  updatedAt: number;
}

type Listener = (t: Telemetry) => void;

const MS_TO_KN = 1.94384;
const RAD_TO_DEG = 180 / Math.PI;

export class SignalKClient {
  private ws: WebSocket | null = null;
  private telemetry: Telemetry = {
    speedOverGroundKn: null,
    courseOverGroundDeg: null,
    depthM: null,
    windSpeedApparentMs: null,
    headingDeg: null,
    updatedAt: 0,
  };

  connect(host: string, onUpdate: Listener, onStatus: (s: "connecting" | "open" | "closed" | "error") => void) {
    this.disconnect();
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";
    const proto = secure ? "wss" : "ws";
    const url = `${proto}://${host}/signalk/v1/stream?subscribe=none`;

    onStatus("connecting");
    try {
      this.ws = new WebSocket(url);
    } catch {
      onStatus("error");
      return;
    }

    this.ws.onopen = () => {
      onStatus("open");
      this.ws?.send(
        JSON.stringify({
          context: "vessels.self",
          subscribe: [
            { path: "navigation.speedOverGround" },
            { path: "navigation.courseOverGroundTrue" },
            { path: "navigation.headingTrue" },
            { path: "environment.depth.belowTransducer" },
            { path: "environment.wind.speedApparent" },
          ],
        })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const updates = msg.updates ?? [];
        for (const update of updates) {
          for (const v of update.values ?? []) {
            switch (v.path) {
              case "navigation.speedOverGround":
                this.telemetry.speedOverGroundKn = v.value * MS_TO_KN;
                break;
              case "navigation.courseOverGroundTrue":
                this.telemetry.courseOverGroundDeg = v.value * RAD_TO_DEG;
                break;
              case "navigation.headingTrue":
                this.telemetry.headingDeg = v.value * RAD_TO_DEG;
                break;
              case "environment.depth.belowTransducer":
                this.telemetry.depthM = v.value;
                break;
              case "environment.wind.speedApparent":
                this.telemetry.windSpeedApparentMs = v.value;
                break;
            }
          }
        }
        this.telemetry.updatedAt = Date.now();
        onUpdate({ ...this.telemetry });
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onerror = () => onStatus("error");
    this.ws.onclose = () => onStatus("closed");
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const INTEGRATION_PROVIDERS = [
  { id: "garmin", name: "Garmin", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "raymarine", name: "Raymarine", note: "Via SeaTalkNG–N2K gateway / SignalK" },
  { id: "simrad", name: "Simrad (Navico)", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "lowrance", name: "Lowrance", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "bg", name: "B&G", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "yachtdevices", name: "Yacht Devices", note: "YDWG-02 WiFi gateway (direct)" },
  { id: "signalk", name: "SignalK Server", note: "Raspberry Pi / onboard server (direct)" },
] as const;
