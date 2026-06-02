import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  courseId: string;
  slug: string;
  title: string;
  thumbnail?: string;
  price: number;
  currency: string;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = { items: [] };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      if (!state.items.some((i) => i.courseId === action.payload.courseId)) {
        state.items.push(action.payload);
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.courseId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
