import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Item {
  id: string;
  description: string;
  quantity: number;
  weight: number;
  imageUrl?: string;
  hsCode?: string;
  suggestions?: any;
}

interface PackingList {
  id: string;
  items: Item[];
  status: 'draft' | 'processing' | 'completed';
  pdfUrl?: string;
  insights?: any;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'compliance' | 'news';
  description?: string;
}

export interface FormHistoryItem {
  id: string;
  date: string;
  hsCode: string;
  description: string;
  value: number;
  dutyAmount: number;
  status: 'completed' | 'pending' | 'error';
  pdfUrl: string;
}

interface AppState {
  packingLists: PackingList[];
  currentPackingList: PackingList | null;
  events: CalendarEvent[];
  formHistory: FormHistoryItem[];
  addPackingList: (list: PackingList) => void;
  updatePackingList: (id: string, updates: Partial<PackingList>) => void;
  setCurrentPackingList: (list: PackingList | null) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addFormToHistory: (form: Omit<FormHistoryItem, 'id' | 'date'>) => void;
  getFormHistory: () => FormHistoryItem[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      packingLists: [],
      currentPackingList: null,
      events: [],
      formHistory: [],
      
      addPackingList: (list) =>
        set((state) => ({
          packingLists: [...state.packingLists, list],
        })),
        
      updatePackingList: (id, updates) =>
        set((state) => ({
          packingLists: state.packingLists.map((list) =>
            list.id === id ? { ...list, ...updates } : list
          ),
        })),
        
      setCurrentPackingList: (list) =>
        set(() => ({
          currentPackingList: list,
        })),
        
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, event],
        })),
        
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        })),
        
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),
        
      addFormToHistory: (formData) => 
        set((state) => {
          const id = 'form-' + Math.random().toString(36).substr(2, 9);
          const newForm: FormHistoryItem = {
            ...formData,
            id,
            date: new Date().toISOString(),
          };
          
          return {
            formHistory: [newForm, ...state.formHistory].slice(0, 50) // Keep only latest 50 forms
          };
        }),
        
      getFormHistory: () => get().formHistory,
    }),
    {
      name: 'turbotariff-storage',
    }
  )
); 