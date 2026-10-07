import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone
} from 'lucide-react';

export default function CategoriesPage() {
  const { categories, transactions, addCategory, updateCategory, deleteCategory } = useFinance();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteCatId, setDeleteCatId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const openAddModal = () => {
    setCategoryToEdit(null);
    setName('');
    setIcon('Folder');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setCategoryToEdit(cat);
    setName(cat.name);
    setIcon(cat.icon || 'Folder');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (categoryToEdit) {
        await updateCategory({
          ...categoryToEdit,
          name: name.trim(),
          icon
        });
        setToastMessage('Category updated successfully.');
      } else {
        await addCategory({
          name: name.trim(),
          icon
        });
        setToastMessage('Category created successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteCatId) {
      try {
        await deleteCategory(deleteCatId);
        setToastMessage('Category deleted.');
      } catch (err) {
        alert(err.message);
      } finally {
        setDeleteCatId(null);
      }
    }
  };

  const handleCardClick = (catName) => {
    navigate(`/transactions?category=${encodeURIComponent(catName)}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-xs text-slate-500 mt-1">Organize transactions into default and custom categories. Click any category to view its transactions.</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const linkedTxns = transactions.filter(t => t.category === cat.name);
          const linkedCount = linkedTxns.length;

          return (
            <div
              key={cat.id}
              onClick={() => handleCardClick(cat.name)}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold transition-colors">
                  <Tag className="w-5 h-5" />
                </div>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {!cat.isDefault && (
                    <>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCatId(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <div className="p-1.5 text-slate-300 group-hover:text-indigo-600 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{cat.isDefault ? 'System Default' : 'Custom'}</span>
                  <span className="font-semibold text-slate-700">{linkedCount} {linkedCount === 1 ? 'txn' : 'txns'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="font-bold text-slate-900 text-lg">
                {categoryToEdit ? 'Edit Category' : 'Add Custom Category'}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Subscriptions, Gym, Pets"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
              >
                {submitting ? 'Saving...' : categoryToEdit ? 'Save Changes' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message="Are you sure you want to delete this custom category? This will check that no active transactions use this category."
      />

      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
}
