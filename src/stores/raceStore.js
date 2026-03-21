import { create } from 'zustand';

const useRaceStore = create((set) => ({
  // Race state
  raceId: null,
  roomCode: null,
  status: 'idle', // idle, searching, waiting, countdown, racing, finished
  passage: '',

  // Players
  localPlayerId: null,
  opponentId: null,
  opponentUsername: null,
  opponentElo: null,
  opponentAvatar: null,

  // Progress
  localProgress: 0,
  localWPM: 0,
  localAccuracy: 100,
  opponentProgress: 0,
  opponentWPM: 0,

  // Countdown
  countdownValue: null,

  // Results
  winnerId: null,
  eloDelta: 0,
  opponentEloDelta: 0,

  // Actions
  setRace: (race) => set({
    raceId: race.id,
    roomCode: race.room_code,
    passage: race.passage,
    status: race.status,
  }),

  setStatus: (status) => set({ status }),
  setPassage: (passage) => set({ passage }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setCountdown: (countdownValue) => set({ countdownValue }),

  setLocalPlayer: (id) => set({ localPlayerId: id }),

  setOpponent: (opponent) => set({
    opponentId: opponent.id,
    opponentUsername: opponent.username,
    opponentElo: opponent.elo,
    opponentAvatar: opponent.avatar_url,
  }),

  updateLocalProgress: (progress, wpm, accuracy) => set({
    localProgress: progress,
    localWPM: wpm,
    localAccuracy: accuracy,
  }),

  updateOpponentProgress: (progress, wpm) => set({
    opponentProgress: progress,
    opponentWPM: wpm,
  }),

  setResults: (winnerId, eloDelta, opponentEloDelta) => set({
    winnerId,
    eloDelta,
    opponentEloDelta,
    status: 'finished',
  }),

  reset: () => set({
    raceId: null,
    roomCode: null,
    status: 'idle',
    passage: '',
    localPlayerId: null,
    opponentId: null,
    opponentUsername: null,
    opponentElo: null,
    opponentAvatar: null,
    localProgress: 0,
    localWPM: 0,
    localAccuracy: 100,
    opponentProgress: 0,
    opponentWPM: 0,
    countdownValue: null,
    winnerId: null,
    eloDelta: 0,
    opponentEloDelta: 0,
  }),
}));

export default useRaceStore;
