import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CustomCategory } from '../types/CustomCategory';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const { user } = useAuth();
  const { handleAsync, error, isLoading, clearError } = useErrorHandler();

  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [user]);

  const fetchCategories = async () => {
    await handleAsync(async () => {
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .order('name');

      if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
      setCategories(data || []);
    }, 'Failed to load categories');
  };

  const createCategory = async (name: string, color: string = '#3B82F6') => {
    if (!user) {
      throw new Error('You must be signed in to create categories');
    }

    return handleAsync(async () => {
      const { data, error } = await supabase
        .from('custom_categories')
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            color,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A category with this name already exists');
        }
        throw new Error(`Failed to create category: ${error.message}`);
      }
      
      setCategories(prev => [...prev, data]);
      return data;
    }, 'Failed to create category');
  };

  const updateCategory = async (id: string, updates: Partial<Pick<CustomCategory, 'name' | 'color'>>) => {
    return handleAsync(async () => {
      const { data, error } = await supabase
        .from('custom_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('A category with this name already exists');
        }
        throw new Error(`Failed to update category: ${error.message}`);
      }
      
      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      return data;
    }, 'Failed to update category');
  };

  const deleteCategory = async (id: string) => {
    return handleAsync(async () => {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id);

      if (error) throw new Error(`Failed to delete category: ${error.message}`);
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }, 'Failed to delete category');
  };

  return {
    categories,
    loading: isLoading,
    error,
    clearError,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}