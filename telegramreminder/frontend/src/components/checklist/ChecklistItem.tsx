import type { ChecklistItem as ChecklistItemType } from '../../types';

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: number) => void;
  onDelete?: (id: number) => void;
  canDelete?: boolean;
}

export function ChecklistItem({ item, onToggle, onDelete, canDelete = false }: ChecklistItemProps) {
  const handleToggle = () => {
    onToggle(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item.id);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-4 bg-tg-secondary-bg rounded-xl cursor-pointer active:opacity-70 transition-opacity animate-fade-in"
      onClick={handleToggle}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          item.completed
            ? 'bg-green-500 border-green-500 checkbox-checked'
            : 'border-tg-hint'
        }`}
      >
        {item.completed && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      <span
        className={`flex-1 text-base transition-all duration-200 ${
          item.completed ? 'text-tg-hint line-through' : 'text-tg-text'
        }`}
      >
        {item.text}
      </span>

      {canDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
