import { configureStore } from "@reduxjs/toolkit";
import { journeyReducer } from "@/store/journeySlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      journey: journeyReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
