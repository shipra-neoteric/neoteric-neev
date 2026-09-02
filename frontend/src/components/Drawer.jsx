import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

const WIDTH = { md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

// The dominant "modal" pattern (style guide §12) — a side drawer, not a centered
// modal, for every create/edit/details view.
export default function Drawer({ title, subtitle, icon: Icon, width = 'md', onClose, footer, children }) {
  const { getThemeColor } = useTheme();

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex justify-end">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={`bg-white dark:bg-gray-800 w-full ${WIDTH[width]} h-full shadow-2xl flex flex-col relative border-l border-gray-200 dark:border-gray-700`}
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0" style={{ backgroundColor: getThemeColor() }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">{title}</h2>
              {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
