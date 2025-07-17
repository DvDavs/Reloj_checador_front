import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isTransitioning: boolean;
  toggleCollapsed: () => void;
}

// Configuración optimizada para Zustand con persistencia y manejo de transiciones
export const useSidebar = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      isTransitioning: false,
      toggleCollapsed: () => {
        // Si ya está en transición, no hacer nada
        if (get().isTransitioning) return;
        
        // Marcar como en transición
        set({ isTransitioning: true });
        
        // Cambiar el estado
        set((state) => ({ isCollapsed: !state.isCollapsed }));
        
        // Desmarcar la transición después de que termine
        setTimeout(() => {
          set({ isTransitioning: false });
        }, 250); // Un poco más que la duración de la animación para asegurar que termine
      },
    }),
    {
      name: 'sidebar-storage', // Nombre para el item en localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Solo persistir isCollapsed
    }
  )
);