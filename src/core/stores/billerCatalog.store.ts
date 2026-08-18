import { create } from "zustand";
import type { BillerCategory } from "../domain/payments";

export type BillerCategoryFilter = BillerCategory | "all";

/**
 * GAP-08: per-session biller catalog state — the search box, category filter, and the favorite
 * set. In-memory on purpose: favorites survive navigation within a session but
 * reset on reload, which is exactly what "persist per session" asks for, and
 * keeping it out of localStorage means no web globals in core.
 */
export const INITIAL_BILLER_CATALOG = {
  searchQuery: "",
  selectedCategory: "all" as BillerCategoryFilter,
  favoriteBillerIds: [] as readonly string[],
};

type BillerCatalogState = typeof INITIAL_BILLER_CATALOG & {
  actions: {
    setSearchQuery(value: string): void;
    setSelectedCategory(category: BillerCategoryFilter): void;
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
    setSelectedCategory: (selectedCategory) => {
      if (get().selectedCategory === selectedCategory) return;
      set({ selectedCategory });
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
