export enum GatewayOpcode {
  Dispatch = 0,
  Heartbeat = 1,
  Identify = 2,
  PresenceUpdate = 3,
  VoiceStateUpdate = 4,
  Resume = 6,
  Reconnect = 7,
  RequestGuildMembers = 8,
  InvalidSession = 9,
  Hello = 10,
  HeartbeatACK = 11,
}

export interface GatewayPayload {
  op: GatewayOpcode;
  d: any;
  s?: number | null;
  t?: string | null;
}

export interface IdentifyPayload {
  token: string;
  intents: number;
  properties: {
    $os: string;
    $browser: string;
    $device: string;
  };
}
