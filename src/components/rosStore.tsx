import { create } from 'zustand';

interface RosState {
  isConnected : boolean;
  isConnecting : boolean;
  rosUrl : string;
  setIsConnected : (connected : boolean) => void;
  setIsConnecting : (connecting : boolean) => void;
  setRosUrl : (url : string) => void;
}

export const useRosStore = create<RosState>((set) => ({
  isConnected : false,
  isConnecting : false,
  rosUrl : 'ws://192.168.137.96:9090',
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsConnecting: (connecting) => set({ isConnecting: connecting}),
  setRosUrl: (url) => set({ rosUrl: url }),
}));