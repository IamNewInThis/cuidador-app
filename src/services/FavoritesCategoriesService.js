import supabase from "../lib/supabase";

class FavoritesCategoriesService {
    // 📂 Crear nueva categoría
    async createCategory({ name, description = null, icon = '⭐', color = '#3B82F6', babyId = null }) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            const categoryData = {
                name,
                description,
                icon,
                color,
                is_default: false,
                user_id: user.id,
                baby_id: babyId // ✅ Agregar baby_id
            };

            const { data, error } = await supabase
                .from('favorites_categories')
                .insert([categoryData])
                .select('*')
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    // 📋 Obtener todas las categorías del usuario para un bebé específico
    async getUserCategories(babyId = null) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            let query = supabase
                .from('favorites_categories')
                .select(`
                    *,
                    favorites_count:favorites(count)
                `)
                .eq('user_id', user.id);

            // Filtrar por baby_id si se proporciona
            if (babyId) {
                query = query.eq('baby_id', babyId);
            } else {
                // Si no se proporciona baby_id, obtener categorías sin baby_id (globales)
                query = query.is('baby_id', null);
            }

            const { data, error } = await query
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching user categories:', error);
            throw error;
        }
    }

    // ✏️ Actualizar categoría
    async updateCategory(categoryId, { name, description, icon, color }) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (icon !== undefined) updateData.icon = icon;
            if (color !== undefined) updateData.color = color;
            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('favorites_categories')
                .update(updateData)
                .eq('id', categoryId)
                .eq('user_id', user.id) // ✅ Verificar que sea del usuario
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    }

    // 🗑️ Eliminar categoría
    async deleteCategory(categoryId) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            // Verificar que no sea la categoría por defecto
            const { data: category } = await supabase
                .from('favorites_categories')
                .select('is_default')
                .eq('id', categoryId)
                .eq('user_id', user.id) // ✅ Verificar que sea del usuario
                .single();

            if (category?.is_default) {
                throw new Error('No se puede eliminar la categoría por defecto');
            }

            const { error } = await supabase
                .from('favorites_categories')
                .delete()
                .eq('id', categoryId)
                .eq('user_id', user.id); // ✅ Verificar que sea del usuario

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }

    // 🔍 Obtener categoría por defecto
    async getDefaultCategory() {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            const { data, error } = await supabase
                .from('favorites_categories')
                .select('*')
                .eq('is_default', true)
                .eq('user_id', user.id) // ✅ Filtrar por usuario
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching default category:', error);
            throw error;
        }
    }

    // 📊 Obtener estadísticas de categorías
    async getCategoriesWithStats(babyId = null) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            // Obtener categorías del usuario
            let categoriesQuery = supabase
                .from('favorites_categories')
                .select('*')
                .eq('user_id', user.id);

            // ✅ Filtrar por baby_id si se especifica
            if (babyId) {
                categoriesQuery = categoriesQuery.eq('baby_id', babyId);
            } else {
                categoriesQuery = categoriesQuery.is('baby_id', null);
            }

            const { data: categories, error: categoriesError } = await categoriesQuery
                .order('is_default', { ascending: false })
                .order('name', { ascending: true });

            if (categoriesError) throw categoriesError;

            // Obtener conteo de favoritos por categoría
            const categoriesWithStats = await Promise.all(
                categories.map(async (category) => {
                    let favoritesQuery = supabase
                        .from('favorites')
                        .select('id', { count: 'exact' })
                        .eq('category_id', category.id)
                        .eq('user_id', user.id);

                    // ✅ Filtrar favoritos por baby_id si se especifica
                    if (babyId) {
                        favoritesQuery = favoritesQuery.eq('baby_id', babyId);
                    }

                    const { count, error: countError } = await favoritesQuery;
                    
                    if (countError) {
                        console.error('Error counting favorites for category:', category.id, countError);
                        return { ...category, favorites_count: 0 };
                    }

                    return { ...category, favorites_count: count || 0 };
                })
            );

            return categoriesWithStats;
        } catch (error) {
            console.error('Error fetching categories with stats:', error);
            throw error;
        }
    }

    // 🎨 Colores predefinidos para facilitar selección
    getPresetColors() {
        return [
            '#3B82F6', // Azul
            '#EF4444', // Rojo
            '#10B981', // Verde
            '#F59E0B', // Amarillo
            '#8B5CF6', // Púrpura
            '#EC4899', // Rosa
            '#6B7280', // Gris
            '#F97316', // Naranja
            '#06B6D4', // Cian
            '#84CC16', // Lima
        ];
    }

    // 😀 Iconos predefinidos
    getPresetIcons() {
        return [
            '⭐', '❤️', '📚', '🍼', '😴', '🏥', '🎯', '📝', '💡', '🔖',
            '🏠', '👶', '🍎', '🎨', '📱', '🎵', '🏃‍♂️', '🎮', '📷', '🌟'
        ];
    }
}

export default new FavoritesCategoriesService();