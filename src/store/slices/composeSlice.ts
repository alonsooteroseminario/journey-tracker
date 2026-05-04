import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ComposeChunkRef {
  chunkId: string;
  sessionOrder: number;
  included: boolean;
}

interface ComposeState {
  refs: ComposeChunkRef[];
}

const initialState: ComposeState = {
  refs: [],
};

const composeSlice = createSlice({
  name: 'compose',
  initialState,
  reducers: {
    addChunk: (state, action: PayloadAction<string>) => {
      const already = state.refs.some((r) => r.chunkId === action.payload);
      if (already) return;
      state.refs.push({ chunkId: action.payload, sessionOrder: state.refs.length, included: true });
    },

    removeChunk: (state, action: PayloadAction<string>) => {
      state.refs = state.refs
        .filter((r) => r.chunkId !== action.payload)
        .map((r, i) => ({ ...r, sessionOrder: i }));
    },

    toggleChunk: (state, action: PayloadAction<string>) => {
      const ref = state.refs.find((r) => r.chunkId === action.payload);
      if (ref) ref.included = !ref.included;
    },

    reorderChunks: (state, action: PayloadAction<string[]>) => {
      const orderedIds = action.payload;
      const refMap = new Map(state.refs.map((r) => [r.chunkId, r]));
      state.refs = orderedIds
        .filter((id) => refMap.has(id))
        .map((id, i) => ({ ...refMap.get(id)!, sessionOrder: i }));
    },

    replaceWithGroup: (state, action: PayloadAction<string[]>) => {
      state.refs = action.payload.map((id, i) => ({ chunkId: id, sessionOrder: i, included: true }));
    },

    appendGroup: (state, action: PayloadAction<string[]>) => {
      const existing = new Set(state.refs.map((r) => r.chunkId));
      for (const id of action.payload) {
        if (!existing.has(id)) {
          state.refs.push({ chunkId: id, sessionOrder: state.refs.length, included: true });
          existing.add(id);
        }
      }
    },

    clearCompose: (state) => {
      state.refs = [];
    },
  },
});

export const {
  addChunk,
  removeChunk,
  toggleChunk,
  reorderChunks,
  replaceWithGroup,
  appendGroup,
  clearCompose,
} = composeSlice.actions;

export const selectComposeRefs = (state: { compose: ComposeState }) =>
  [...state.compose.refs].sort((a, b) => a.sessionOrder - b.sessionOrder);

export default composeSlice.reducer;
