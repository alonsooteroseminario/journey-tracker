import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import composeReducer, {
  addChunk,
  removeChunk,
  toggleChunk,
  reorderChunks,
  replaceWithGroup,
  appendGroup,
  clearCompose,
  selectComposeRefs,
  type ComposeChunkRef,
} from './composeSlice';

function makeStore() {
  return configureStore({
    reducer: { compose: composeReducer },
  });
}

function refs(store: ReturnType<typeof makeStore>): ComposeChunkRef[] {
  return selectComposeRefs(store.getState());
}

describe('composeSlice', () => {
  describe('addChunk', () => {
    it('appends a new chunk ref with included=true', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      expect(refs(store)).toEqual([{ chunkId: 'c1', sessionOrder: 0, included: true }]);
    });

    it('is idempotent — ignores duplicate chunkId', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c1'));
      expect(refs(store)).toHaveLength(1);
    });

    it('appends multiple chunks with increasing sessionOrder', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(addChunk('c3'));
      const r = refs(store);
      expect(r.map((x) => x.chunkId)).toEqual(['c1', 'c2', 'c3']);
      expect(r.map((x) => x.sessionOrder)).toEqual([0, 1, 2]);
    });
  });

  describe('removeChunk', () => {
    it('removes a chunk by chunkId', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(removeChunk('c1'));
      expect(refs(store).map((r) => r.chunkId)).toEqual(['c2']);
    });

    it('renumbers sessionOrder after removal', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(addChunk('c3'));
      store.dispatch(removeChunk('c2'));
      const r = refs(store);
      expect(r.map((x) => x.sessionOrder)).toEqual([0, 1]);
    });

    it('is a no-op when chunkId not present', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(removeChunk('c-not-there'));
      expect(refs(store)).toHaveLength(1);
    });
  });

  describe('toggleChunk', () => {
    it('flips included to false', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(toggleChunk('c1'));
      expect(refs(store)[0].included).toBe(false);
    });

    it('flips included back to true', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(toggleChunk('c1'));
      store.dispatch(toggleChunk('c1'));
      expect(refs(store)[0].included).toBe(true);
    });

    it('only toggles the targeted chunk', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(toggleChunk('c1'));
      const r = refs(store);
      expect(r.find((x) => x.chunkId === 'c1')!.included).toBe(false);
      expect(r.find((x) => x.chunkId === 'c2')!.included).toBe(true);
    });

    it('is a no-op when chunkId not present', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(toggleChunk('c-missing'));
      expect(refs(store)[0].included).toBe(true);
    });
  });

  describe('reorderChunks', () => {
    it('reorders refs according to the new id order', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(addChunk('c3'));
      store.dispatch(reorderChunks(['c3', 'c1', 'c2']));
      expect(refs(store).map((r) => r.chunkId)).toEqual(['c3', 'c1', 'c2']);
    });

    it('renumbers sessionOrder to match new positions', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(reorderChunks(['c2', 'c1']));
      const r = refs(store);
      expect(r[0]).toMatchObject({ chunkId: 'c2', sessionOrder: 0 });
      expect(r[1]).toMatchObject({ chunkId: 'c1', sessionOrder: 1 });
    });

    it('ignores ids not present in refs', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(reorderChunks(['c-ghost', 'c1']));
      expect(refs(store).map((r) => r.chunkId)).toEqual(['c1']);
    });

    it('preserves included state through reorder', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(toggleChunk('c1'));
      store.dispatch(reorderChunks(['c2', 'c1']));
      const r = refs(store);
      expect(r.find((x) => x.chunkId === 'c1')!.included).toBe(false);
      expect(r.find((x) => x.chunkId === 'c2')!.included).toBe(true);
    });
  });

  describe('replaceWithGroup', () => {
    it('clears existing refs and adds new ones', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(replaceWithGroup(['cA', 'cB', 'cC']));
      expect(refs(store).map((r) => r.chunkId)).toEqual(['cA', 'cB', 'cC']);
    });

    it('all new refs have included=true', () => {
      const store = makeStore();
      store.dispatch(replaceWithGroup(['cA', 'cB']));
      expect(refs(store).every((r) => r.included)).toBe(true);
    });

    it('assigns sessionOrder by position', () => {
      const store = makeStore();
      store.dispatch(replaceWithGroup(['cX', 'cY']));
      expect(refs(store).map((r) => r.sessionOrder)).toEqual([0, 1]);
    });

    it('can replace with empty array (clear)', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(replaceWithGroup([]));
      expect(refs(store)).toEqual([]);
    });
  });

  describe('appendGroup', () => {
    it('appends chunks not already in compose', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(appendGroup(['c2', 'c3']));
      expect(refs(store).map((r) => r.chunkId)).toEqual(['c1', 'c2', 'c3']);
    });

    it('skips chunks already present', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(appendGroup(['c1', 'c2']));
      expect(refs(store).map((r) => r.chunkId)).toEqual(['c1', 'c2']);
    });

    it('appended refs have included=true', () => {
      const store = makeStore();
      store.dispatch(appendGroup(['cA']));
      expect(refs(store)[0].included).toBe(true);
    });
  });

  describe('clearCompose', () => {
    it('removes all refs', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(clearCompose());
      expect(refs(store)).toEqual([]);
    });

    it('is a no-op on empty state', () => {
      const store = makeStore();
      store.dispatch(clearCompose());
      expect(refs(store)).toEqual([]);
    });
  });

  describe('selectComposeRefs', () => {
    it('returns refs sorted by sessionOrder', () => {
      const store = makeStore();
      store.dispatch(addChunk('c1'));
      store.dispatch(addChunk('c2'));
      store.dispatch(addChunk('c3'));
      store.dispatch(reorderChunks(['c3', 'c1', 'c2']));
      const r = selectComposeRefs(store.getState());
      expect(r[0].chunkId).toBe('c3');
      expect(r[1].chunkId).toBe('c1');
      expect(r[2].chunkId).toBe('c2');
    });
  });
});
