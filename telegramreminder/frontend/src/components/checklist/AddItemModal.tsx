import { useState } from 'react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (text: string) => Promise<void>;
}

export function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      await onAdd(text.trim());
      setText('');
      onClose();
    } catch {
      // Error handling is done in parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-tg-bg w-full max-w-lg rounded-t-2xl p-6 animate-fade-in">
        <h2 className="text-lg font-semibold text-tg-text mb-4">Add New Item</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter item text..."
            className="w-full px-4 py-3 bg-tg-secondary-bg rounded-xl text-tg-text placeholder-tg-hint outline-none focus:ring-2 focus:ring-tg-button"
            autoFocus
          />

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-tg-secondary-bg text-tg-text font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-tg-button text-tg-button-text font-medium disabled:opacity-50"
              disabled={isLoading || !text.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
