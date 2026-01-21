import { useEffect, useState } from 'react';
import { useChecklist } from '../hooks/useChecklist';
import { useAuth } from '../hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import { ChecklistItem } from '../components/checklist/ChecklistItem';
import { AddItemModal } from '../components/checklist/AddItemModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function HomePage() {
  const { items, isLoading, error, fetchItems, toggleItem, addItem, deleteItem } = useChecklist();
  const { user } = useAuth();
  const { hapticFeedback, showConfirm } = useTelegram();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggle = async (id: number) => {
    try {
      hapticFeedback('light');
      await toggleItem(id);
    } catch {
      hapticFeedback('error');
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm('Are you sure you want to delete this item?');
    if (confirmed) {
      try {
        hapticFeedback('medium');
        await deleteItem(id);
      } catch {
        hapticFeedback('error');
      }
    }
  };

  const handleAddItem = async (text: string) => {
    await addItem(text);
    hapticFeedback('success');
  };

  const completedCount = items.filter((item) => item.completed).length;

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-bg">
      {/* Header */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-sm z-10 px-4 py-4 border-b border-tg-secondary-bg">
        <h1 className="text-xl font-bold text-tg-text">Checklist</h1>
        <p className="text-sm text-tg-hint mt-1">
          {completedCount} of {items.length} completed
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-tg-secondary-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 py-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-tg-hint">No items in the checklist</p>
            {user?.isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-6 py-2 bg-tg-button text-tg-button-text rounded-xl font-medium"
              >
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={user?.isAdmin ? handleDelete : undefined}
                canDelete={user?.isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button (Admin only) */}
      {user?.isAdmin && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-tg-button text-tg-button-text rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
      />
    </div>
  );
}
