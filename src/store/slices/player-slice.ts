import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PlayerState = {
  currentLessonId: string | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isPlaying: boolean;
  lastSavedAt: number | null;
};

const initialState: PlayerState = {
  currentLessonId: null,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  isPlaying: false,
  lastSavedAt: null,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setCurrentLesson(state, action: PayloadAction<string | null>) {
      state.currentLessonId = action.payload;
      state.currentTime = 0;
      state.isPlaying = false;
    },
    setProgress(
      state,
      action: PayloadAction<{ currentTime: number; duration: number }>,
    ) {
      state.currentTime = action.payload.currentTime;
      state.duration = action.payload.duration;
    },
    setPlaybackRate(state, action: PayloadAction<number>) {
      state.playbackRate = action.payload;
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
    },
    markSaved(state) {
      state.lastSavedAt = Date.now();
    },
  },
});

export const {
  setCurrentLesson,
  setProgress,
  setPlaybackRate,
  setIsPlaying,
  markSaved,
} = playerSlice.actions;
export default playerSlice.reducer;
