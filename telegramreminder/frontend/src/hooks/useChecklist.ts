import { create } from 'zustand';
import { api } from '../services/api';
import type { ChecklistItem } from '../types';

interface ChecklistState {
  items: ChecklistItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  toggleItem: (id: number) => Promise<void>;
  addItem: (text: string) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useChecklist = create<ChecklistState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getChecklist();
      set({ items: response.items, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch items';
      set({ error: message, isLoading: false });
    }
  },

  toggleItem: async (id: number) => {
    // Optimistic update
    const prevItems = get().items;
    set({
      items: prevItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    });

    try {
      const response = await api.toggleItem(id);
      set({
        items: get().items.map((item) =>
          item.id === id ? response.item : item
        ),
      });
    } catch (err) {
      // Revert on error
      set({ items: prevItems });
      throw err;
    }
  },

  addItem: async (text: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.addItem(text);
      set({
        items: [...get().items, response.item],
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  deleteItem: async (id: number) => {
    const prevItems = get().items;
    set({
      items: prevItems.filter((item) => item.id !== id),
    });

    try {
      await api.deleteItem(id);
    } catch (err) {
      set({ items: prevItems });
      throw err;
    }
  },

  resetAll: async () => {
    try {
      await api.resetChecklist();
      set({
        items: get().items.map((item) => ({ ...item, completed: false })),
      });
    } catch (err) {
      throw err;
    }
  },
}));
