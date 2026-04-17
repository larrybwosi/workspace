import { create } from 'zustand';

interface InfoPanelState {
  isManuallyClosed: boolean;
  setManuallyClosed: (closed: boolean) => void;
}

export const useInfoPanelStore = create<InfoPanelState>(set => ({
  isManuallyClosed: false,
  setManuallyClosed: closed => set({ isManuallyClosed: closed }),
}));
