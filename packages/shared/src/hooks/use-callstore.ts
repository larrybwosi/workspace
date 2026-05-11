import { create } from 'zustand';

export interface CallState {
  activeCall: {
    callId: string;
    channelName: string;
    type: 'voice' | 'video';
    token: string;
    uid: number;
    appId: string;
    workspaceSlug?: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isSpeakerphone?: boolean;
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
    workspaceId: string;
    workspaceSlug?: string;
  } | null;
  isMinimized: boolean;
  setCall: (call: CallState['activeCall']) => void;
  setIncoming: (data: CallState['incomingCallData']) => void;
  updateActiveCall: (updates: Partial<NonNullable<CallState['activeCall']>>) => void;
  endCall: () => void;
  rejectCall: () => void;
  setMinimized: (minimized: boolean) => void;
}

export const useCallStore = create<CallState>(set => ({
  activeCall: null,
  isIncoming: false,
  incomingCallData: null,
  isMinimized: false,
  setCall: call => set({ activeCall: call, isIncoming: false, incomingCallData: null, isMinimized: false }),
  setIncoming: data => set({ isIncoming: true, incomingCallData: data }),
  updateActiveCall: (updates) => set(state => ({
    activeCall: state.activeCall ? { ...state.activeCall, ...updates } : null
  })),
  endCall: () => set({ activeCall: null, isMinimized: false }),
  rejectCall: () => set({ isIncoming: false, incomingCallData: null }),
  setMinimized: (minimized) => set({ isMinimized: minimized }),
}));
