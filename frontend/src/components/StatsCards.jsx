// Generic clickable KPI grid (style guide §6). Card count decides the grid — always
// the literal Tailwind class (never a template string) so the JIT scanner finds it.
const GRID_COLS = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4', 5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export default function StatsCards({ cards, activeFilter, onCardClick }) {
  return (
    <div className={`grid ${GRID_COLS[cards.length] ?? 'grid-cols-2 sm:grid-cols-4'} gap-3 sm:gap-4 mb-4 sm:mb-6`}>
      {cards.map((card) => {
        const Icon = card.icon;
        const clickable = !!onCardClick;
        const Tag = clickable ? 'button' : 'div';
        return (
          <Tag key={card.key}
            onClick={clickable ? () => onCardClick(card.key) : undefined}
            className={`h-full bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow hover:shadow-lg transition-all
              duration-200 text-left relative overflow-hidden group
              ${activeFilter === card.key ? `ring-2 ${card.ringColor ?? 'ring-primary-500'}` : ''}`}
          >
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
            <p className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white mt-2">{card.value}</p>
            {card.sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.sub}</p>}
            {Icon && (
              <Icon className="absolute bottom-2 right-2 w-6 h-6 text-gray-400 transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
            )}
          </Tag>
        );
      })}
    </div>
  );
}
