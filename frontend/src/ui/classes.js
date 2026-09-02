// Centralized Tailwind utility strings (style guide §7, §14) — still plain utility
// classes, just shared so every page doesn't retype the same button/input recipe.

export const btn = {
  secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
  danger: 'bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
  success: 'bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
  icon: 'w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95',
};

// Primary CTA needs the dynamic theme color as an inline style — call primaryStyle()
// alongside this class string: <button className={btn.primaryBase} style={primaryStyle(getThemeColor())}>
export const btnPrimaryBase = 'text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';
export const primaryStyle = (color) => ({ backgroundColor: color });

export function inputClass(hasError) {
  return `w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${hasError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`;
}

export const label = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
export const microLabel = 'text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1';
export const card = 'bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4';
export const insetPanel = 'bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700';
