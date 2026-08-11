import { create } from "zustand";

/**
 * GAP-08: per-session biller catalog state — the search box and the favorite
 * set. In-memory on purpose: favorites survive navigation within a session but
 * reset on reload, which is exactly what "persist per session" asks for, and
 * keeping it out of localStorage means no web globals in core.
 */
export const INITIAL_BILLER_CATALOG = {
  searchQuery: "",
  favoriteBillerIds: [] as readonly string[],
};

type BillerCatalogState = typeof INITIAL_BILLER_CATALOG & {
  actions: {
    setSearchQuery(value: string): void;
    toggleFavorite(id: string): void;
    reset(): void;
  };
};

export const useBillerCatalogStore = create<BillerCatalogState>()((set, get) => ({
  ...INITIAL_BILLER_CATALOG,
  actions: {
    setSearchQuery: (searchQuery) => {
      if (get().searchQuery === searchQuery) return;
      set({ searchQuery });
    },
    toggleFavorite: (id) =>
      set((state) => ({
        favoriteBillerIds: state.favoriteBillerIds.includes(id)
          ? state.favoriteBillerIds.filter((candidate) => candidate !== id)
          : [...state.favoriteBillerIds, id],
      })),
    reset: () => set(INITIAL_BILLER_CATALOG),
  },
}));

export const billerCatalogActions = useBillerCatalogStore.getState().actions;
