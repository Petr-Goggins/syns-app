import { useOutletContext } from 'react-router-dom';

interface LayoutContext {
  onOpenSidebar: () => void;
}

/**
 * Хук для получения функций layout из context
 * Используется в страницах для открытия sidebar на мобильных
 */
export function useLayout() {
  return useOutletContext<LayoutContext>();
}
