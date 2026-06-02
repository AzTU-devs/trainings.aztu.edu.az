import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UIState = {
  mobileNavOpen: boolean;
  learningSidebarOpen: boolean;
  theme: "light" | "dark" | "system";
};

const initialState: UIState = {
  mobileNavOpen: false,
  learningSidebarOpen: true,
  theme: "system",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMobileNav(state) {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    toggleLearningSidebar(state) {
      state.learningSidebarOpen = !state.learningSidebarOpen;
    },
    setTheme(state, action: PayloadAction<UIState["theme"]>) {
      state.theme = action.payload;
    },
  },
});

export const {
  toggleMobileNav,
  setMobileNavOpen,
  toggleLearningSidebar,
  setTheme,
} = uiSlice.actions;
export default uiSlice.reducer;
