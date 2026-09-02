import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

// Colored info/alert panel (style guide §8) — literal class names per level so
// Tailwind's JIT scanner can find them (no dynamic bg-${color}-50 interpolation).
const LEVELS = {
  info: {
    wrap: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40',
    tile: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
    Icon: Info,
  },
  warn: {
    wrap: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40',
    tile: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
    Icon: AlertTriangle,
  },
  crit: {
    wrap: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40',
    tile: 'bg-red-100 dark:bg-red-900/30 text-red-500',
    Icon: ShieldAlert,
  },
};

export default function AlertBanner({ level = 'info', children }) {
  const { wrap, tile, Icon } = LEVELS[level];
  return (
    <div className={`flex items-start gap-3 border rounded-xl p-3.5 ${wrap}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tile}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 pt-1">{children}</div>
    </div>
  );
}
