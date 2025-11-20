import { useState, useCallback, useRef } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

// Better deep compare (safe + prevents unnecessary re-renders)
const isEqual = (a: any, b: any) => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const lastSavedState = useRef(initialState);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // ------------------
  // UNDO
  // ------------------
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, h.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  // ------------------
  // REDO
  // ------------------
  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;

      const next = h.future[0];
      const newFuture = h.future.slice(1);

      return {
        past: [...h.past, h.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // ------------------
  // SET STATE
  // ------------------
const setState = useCallback((value: T | ((prev: T) => T)) => {
  setHistory((h) => {
    const nextValue =
      typeof value === "function"
        ? (value as (prev: T) => T)(h.present)
        : value;

    if (isEqual(nextValue, h.present)) return h;

    const lastPast = h.past[h.past.length - 1];

    // FIX: don't push duplicate history entries
    if (lastPast && isEqual(lastPast, nextValue)) {
      return { ...h, present: nextValue };
    }

    return {
      past: [...h.past, h.present],
      present: nextValue,
      future: [],
    };
  });
}, []);


  // ------------------
  // RESET
  // ------------------
  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
    lastSavedState.current = newState;
  }, []);

  // Save current state as "saved"
  const markAsSaved = useCallback(() => {
    lastSavedState.current = history.present;
  }, [history.present]);

  const hasUnsavedChanges = !isEqual(history.present, lastSavedState.current);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    markAsSaved,
    hasUnsavedChanges,
  };
}

export default useUndoRedo;
