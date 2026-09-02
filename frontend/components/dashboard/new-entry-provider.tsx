"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type OpenOptions = {
  injuryId?: number;
  kind?: "Symptom" | "Visit" | "Treatment";
};

type NewEntryContextValue = {
  open: boolean;
  options: OpenOptions;
  openNewEntry: (options?: OpenOptions) => void;
  closeNewEntry: () => void;
};

const NewEntryContext = createContext<NewEntryContextValue | null>(null);

// The design makes "New entry" a modal rather than a page, so the control that
// opens it (the sidebar button) and the dialog itself live in different parts
// of the tree. This is the only thing between them.
export function NewEntryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<OpenOptions>({});

  const openNewEntry = useCallback((next: OpenOptions = {}) => {
    setOptions(next);
    setOpen(true);
  }, []);

  const closeNewEntry = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, options, openNewEntry, closeNewEntry }),
    [open, options, openNewEntry, closeNewEntry],
  );

  return (
    <NewEntryContext.Provider value={value}>{children}</NewEntryContext.Provider>
  );
}

export function useNewEntry() {
  const context = useContext(NewEntryContext);

  if (!context) {
    throw new Error("useNewEntry must be used inside a NewEntryProvider");
  }

  return context;
}
