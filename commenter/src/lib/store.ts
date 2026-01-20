import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, ApiConfig, DEFAULT_PROJECTS, DEFAULT_PERSONALITY, DEFAULT_BEHAVIOR, DEFAULT_PROMPT_TEMPLATE } from '../types';

interface AppState {
  students: Student[];
  config: ApiConfig;
  setStudents: (students: Student[]) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  batchUpdateStudents: (ids: string[], updates: Partial<Student>) => void;
  toggleSelectAll: (selected: boolean) => void;
  setConfig: (config: ApiConfig) => void;
  resetFeatureDefaults: () => void;
  addCustomItem: (type: 'customProjects' | 'customPersonality' | 'customBehavior', item: string) => void;
  removeCustomItem: (type: 'customProjects' | 'customPersonality' | 'customBehavior', item: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      students: [],
      config: {
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        model: 'deepseek-chat',
        customProjects: [],
        customPersonality: [],
        customBehavior: [],
        promptTemplate: DEFAULT_PROMPT_TEMPLATE,
      },
      setStudents: (students) => set({ students }),
      updateStudent: (id, updates) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      batchUpdateStudents: (ids, updates) =>
        set((state) => ({
          students: state.students.map((s) => 
            ids.includes(s.id) ? { ...s, ...updates } : s
          ),
        })),
      toggleSelectAll: (selected) =>
        set((state) => ({
          students: state.students.map((s) => ({ ...s, selected })),
        })),
      setConfig: (config) => set({ config }),
      resetFeatureDefaults: () =>
        set((state) => ({
          config: {
            ...state.config,
            customProjects: [],
            customPersonality: [],
            customBehavior: [],
          }
        })),
      addCustomItem: (type, item) => 
        set((state) => ({
          config: {
            ...state.config,
            [type]: [...(state.config[type] || []), item]
          }
        })),
      removeCustomItem: (type, item) =>
        set((state) => ({
          config: {
            ...state.config,
            [type]: state.config[type].filter(i => i !== item)
          }
        })),
    }),
    {
      name: 'ai-student-commenter-storage',
    }
  )
);
