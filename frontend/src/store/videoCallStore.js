import {create} from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      // Room state
      currentRoom: null,
      setCurrentRoom: (room) => set({ currentRoom: room }),
      clearCurrentRoom: () => set({ currentRoom: null }),

      // Call state
      isCallActive: false,
      setIsCallActive: (status) => set({ isCallActive: status }),

      // Stream states
      myStream: null,
      remoteStream: null,
      streamKey: 0,
      setMyStream: (stream) => set({ myStream: stream }),
      setStreamKey: (key) => set({ streamKey: key }),
      incrementStreamKey: () => set((state) => ({ streamKey: state.streamKey + 1 })),
      setRemoteStream: (stream) => set({ remoteStream: stream }),
      clearStreams: () => set({ myStream: null, remoteStream: null }),

      // Remote socket id
      remoteSocketId: null,
      setRemoteSocketId: (id) => set({ remoteSocketId: id }),
      clearRemoteSocketId: () => set({ remoteSocketId: null }),

      // Media control states
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: true,
      setIsMuted: (isMuted) => set(() => ({ isMuted })), // Pass the exact state value
      setIsVideoOff: (isVideoOff) => set(() => ({ isVideoOff })), // Pass the exact state value
      setIsScreenSharing: (isScreenSharing) => set(() => ({ isScreenSharing })), // Pass the exact state value

      // Remote user state
      remoteUser: null,
      setRemoteUser: (user) => set({ remoteUser: user }),
      clearRemoteUser: () => set({ remoteUser: null }),

      // Utility functions
      resetCallState: () => set({
        isCallActive: false,
        myStream: null,
        remoteStream: null,
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        remoteUser: null,
        currentRoom: null,
        remoteSocketId: null,
      }),

      // Example of a more complex action that uses multiple state updates
      initializeCall: (room, localStream) => {
        set({
          currentRoom: room,
          myStream: localStream,
          isCallActive: true,
          isMuted: false,
          isVideoOff: false,
          isScreenSharing: true,
        });
      },
    }),
    {
      name: 'video-call-storage', // name of the item in local storage
      getStorage: () => localStorage, // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        user: state.user,
        currentRoom: state.currentRoom,
        // Add other states you want to persist
        // Avoid persisting large objects like streams
      }),
    }
  )
);

export default useStore;