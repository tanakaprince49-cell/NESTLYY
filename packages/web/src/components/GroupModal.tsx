import React, { useState } from 'react';
import { X, Users, Link2, Edit2, Trash2 } from 'lucide-react';
import { Nest, NestCategory } from '@nestly/shared';

interface GroupModalProps {
  onClose: () => void;
  nest?: Nest;
  mode: 'create' | 'edit';
  onSave: (nest: Nest) => void;
  onDelete?: (nestId: string) => void;
  userUid?: string;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  onClose,
  nest,
  mode = 'create',
  onSave,
  onDelete,
  userUid = ''
}) => {
  const [formData, setFormData] = useState({
    name: nest?.name || '',
    description: nest?.description || '',
    category: nest?.category || 'general' as NestCategory,
    emoji: nest?.emoji || '🌸',
    rules: nest?.rules || ''
  });

  const CATEGORIES: { label: string; value: NestCategory }[] = [
    { label: 'General', value: 'general' },
    { label: 'Trimester', value: 'trimester' },
    { label: 'Lifestyle', value: 'lifestyle' },
    { label: 'Diet', value: 'diet' },
    { label: 'Support', value: 'support' },
    { label: 'Postpartum', value: 'postpartum' }
  ];

  const EMOJI_OPTIONS = ['🌸', '🌿', '🦋', '🌙', '🔥', '💪', '🧘', '🎯', '🫶', '☀️', '🍼', '🎀'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    const nestData: Nest = {
      id: nest?.id || crypto.randomUUID(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      emoji: formData.emoji,
      rules: formData.rules.trim(),
      memberCount: nest?.memberCount || 0,
      isTemplate: false,
      createdAt: nest?.createdAt || Date.now(),
      creatorUid: userUid,
      shareLink: nest?.shareLink || `${window.location.origin}/village?invite=${nest?.id || crypto.randomUUID()}`
    };

    onSave(nestData);
    onClose();
  };

  const handleDelete = () => {
    if (nest && onDelete) {
      if (confirm(`Are you sure you want to delete "${nest.name}"? This action cannot be undone.`)) {
        onDelete(nest.id);
        onClose();
      }
    }
  };

  const copyShareLink = () => {
    if (nest?.shareLink) {
      navigator.clipboard.writeText(nest.shareLink);
      alert('Share link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-slate-800">
            {mode === 'create' ? 'Create New Nest' : 'Edit Nest'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nest Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., First Trimester Moms"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
              maxLength={50}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as NestCategory })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's this nest about? Who should join?"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 resize-none"
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Emoji Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nest Emoji
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.emoji === emoji
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Community Rules
            </label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Optional: Set guidelines for your community..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200 resize-none"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Share Link (for edit mode) */}
          {mode === 'edit' && nest?.shareLink && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nest.shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-600"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="px-4 py-3 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                  <Link2 size={16} />
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete Nest
              </button>
            )}
            
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              {mode === 'create' ? 'Create Nest' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
