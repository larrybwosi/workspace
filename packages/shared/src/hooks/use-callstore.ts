import { create } from 'zustand';

interface CallState {
  activeCall: {
    callId: string;
    channelName: string;
    type: 'voice' | 'video';
    token: string;
    uid: number;
    appId: string;
    workspaceSlug?: string;
  } | null;
  isIncoming: boolean;
  incomingCallData: {
    callId: string;
    type: 'voice' | 'video';
    initiator: {
      id: string;
      name: string;
      image: string;
    };
    workspaceId: string; // The backend might still send workspaceId here, but we'll treat it as slug if needed
  } | null;
  setCall: (call: CallState['activeCall']) => void;
  setIncoming: (data: CallState['incomingCallData']) => void;
  endCall: () => void;
  rejectCall: () => void;
}

export const useCallStore = create<CallState>(set => ({
  activeCall: null,
  isIncoming: false,
  incomingCallData: null,
  setCall: call => set({ activeCall: call, isIncoming: false, incomingCallData: null }),
  setIncoming: data => set({ isIncoming: true, incomingCallData: data }),
  endCall: () => set({ activeCall: null }),
  rejectCall: () => set({ isIncoming: false, incomingCallData: null }),
}));
