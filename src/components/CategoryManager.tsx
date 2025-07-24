import React, { useState } from 'react';
import { Plus, X, Edit3, Trash2, Palette } from 'lucide-react';
import { useCustomCategories } from '../hooks/useCustomCategories';

interface CategoryManagerProps {
  onClose: () => void;
}

const predefinedColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { categories, createCategory, updateCategory, deleteCategory } = useCustomCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    const { error } = await createCategory(newCategoryName, newCategoryColor);
    
    if (!error) {
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
    }
    setLoading(false);
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim()) return;

    setLoading(true);
    const { error } = await updateCategory(id, { name: editName, color: editColor });
    
    if (!error) {
      setEditingCategory(null);
      setEditName('');
      setEditColor('');
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      setLoading(true);
      await deleteCategory(id);
      setLoading(false);
    }
  };

  const startEditing = (category: any) => {
    setEditingCategory(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditName('');
    setEditColor('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Categories</h2>
            <p className="text-sm text-gray-600 mt-1">Create and organize your custom task categories</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create New Category */}
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plus size={20} className="text-blue-600" />
              Add New Category
            </h3>
            
            <div>
              <label htmlFor="categoryName" className="block text-sm font-semibold text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      newCategoryColor === color ? 'border-gray-600 scale-110 shadow-lg' : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="mt-3 w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newCategoryName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus size={16} />
              Add Category
            </button>
          </form>

          {/* Existing Categories */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette size={20} className="text-purple-600" />
              Your Categories
            </h3>
            
            {categories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Palette size={48} className="text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No custom categories yet</p>
                <p className="text-gray-400 text-sm">Create your first category above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-all duration-200"
                  >
                    {editingCategory === category.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: editColor }}
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <button
                          onClick={() => handleUpdateCategory(category.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-700 disabled:opacity-50 p-2 hover:bg-green-50 rounded-lg transition-all duration-200"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-all duration-200"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-semibold text-gray-900">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(category)}
                            className="text-gray-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={loading}
                            className="text-gray-600 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};