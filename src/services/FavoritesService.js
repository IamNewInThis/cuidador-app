import supabase from "../lib/supabase";

class FavoritesService {
    // ⭐ Agregar mensaje a favoritos
    async addToFavorites({ conversationMessageId, categoryId = null, customTitle = null, notes = null }) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            // Si no se especifica categoría, usar la categoría por defecto
            if (!categoryId) {
                const { data: defaultCategory } = await supabase
                    .from('favorites_categories')
                    .select('id')
                    .eq('is_default', true)
                    .eq('user_id', user.id) // ✅ Filtrar por usuario
                    .single();
                
                categoryId = defaultCategory?.id;
            }

            const { data, error } = await supabase
                .from('favorites')
                .insert([{
                    conversation_message_id: conversationMessageId,
                    category_id: categoryId,
                    custom_title: customTitle,
                    notes,
                    user_id: user.id // ✅ Agregar user_id
                }])
                .select(`
                    *,
                    category:favorites_categories(*)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            throw error;
        }
    }

    // 🗑️ Quitar de favoritos
    async removeFromFavorites(conversationMessageId) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('conversation_message_id', conversationMessageId)
                .eq('user_id', user.id); // ✅ Verificar que sea del usuario

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            throw error;
        }
    }

    // 📋 Obtener todos los favoritos del usuario
    async getUserFavorites(categoryId = null, limit = 100) {
        try {
            // Obtener el usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Usuario no autenticado');
            }

            let query = supabase
                .from('favorites')
                .select(`
                    *,
                    category:favorites_categories(*),
                    conversation:conversations!inner(
                        id,
                        content,
                        role,
                        created_at,
                        baby_id,
                        baby:babies(
                            name
                        )
                    )
                `)
                .eq('user_id', user.id) // ✅ Filtrar por usuario
                .order('created_at', { ascending: false })
                .limit(limit);

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching favorites:', error);
            throw error;
        }
    }

    // 📂 Obtener favoritos agrupados por categoría
    async getFavoritesByCategory() {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    category:favorites_categories(*),
                    conversation:conversations!inner(
                        id,
                        content,
                        role,
                        created_at,
                        baby_id
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Agrupar por categoría
            const grouped = data.reduce((acc, favorite) => {
                const categoryId = favorite.category_id || 'uncategorized';
                const categoryName = favorite.category?.name || 'Sin categoría';
                
                if (!acc[categoryId]) {
                    acc[categoryId] = {
                        category: favorite.category,
                        favorites: []
                    };
                }
                
                acc[categoryId].favorites.push(favorite);
                return acc;
            }, {});

            return grouped;
        } catch (error) {
            console.error('Error fetching favorites by category:', error);
            throw error;
        }
    }

    // ✅ Verificar si un mensaje es favorito
    async isFavorite(conversationMessageId) {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('id, category_id')
                .eq('conversation_message_id', conversationMessageId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data ? { isFavorite: true, categoryId: data.category_id } : { isFavorite: false };
        } catch (error) {
            console.error('Error checking favorite status:', error);
            return { isFavorite: false };
        }
    }

    // 🔄 Toggle favorito
    async toggleFavorite(conversationMessageId, categoryId = null) {
        try {
            const { isFavorite } = await this.isFavorite(conversationMessageId);
            
            if (isFavorite) {
                await this.removeFromFavorites(conversationMessageId);
                return { isFavorite: false, action: 'removed' };
            } else {
                await this.addToFavorites({ conversationMessageId, categoryId });
                return { isFavorite: true, action: 'added' };
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    // ✏️ Actualizar favorito
    async updateFavorite(favoriteId, { categoryId, customTitle, notes }) {
        try {
            const updateData = {};
            if (categoryId !== undefined) updateData.category_id = categoryId;
            if (customTitle !== undefined) updateData.custom_title = customTitle;
            if (notes !== undefined) updateData.notes = notes;
            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('favorites')
                .update(updateData)
                .eq('id', favoriteId)
                .select(`
                    *,
                    category:favorites_categories(*)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating favorite:', error);
            throw error;
        }
    }

    // 🔍 Buscar en favoritos
    async searchFavorites(searchTerm, categoryId = null) {
        try {
            let query = supabase
                .from('favorites')
                .select(`
                    *,
                    category:favorites_categories(*),
                    conversation:conversations!inner(
                        id,
                        content,
                        role,
                        created_at,
                        baby_id
                    )
                `)
                .or(`custom_title.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%,conversation.content.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching favorites:', error);
            throw error;
        }
    }

    // 📊 Obtener estadísticas de favoritos
    async getFavoritesStats() {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    id,
                    category_id,
                    created_at,
                    category:favorites_categories(name, color, icon)
                `);

            if (error) throw error;

            const stats = {
                total: data.length,
                byCategory: {},
                recentCount: 0,
                thisWeek: 0,
                thisMonth: 0
            };

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            data.forEach(favorite => {
                // Contar por categoría
                const categoryName = favorite.category?.name || 'Sin categoría';
                if (!stats.byCategory[categoryName]) {
                    stats.byCategory[categoryName] = 0;
                }
                stats.byCategory[categoryName]++;

                // Contar por tiempo
                const createdAt = new Date(favorite.created_at);
                if (createdAt >= weekAgo) {
                    stats.thisWeek++;
                    stats.recentCount++;
                }
                if (createdAt >= monthAgo) {
                    stats.thisMonth++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error fetching favorites stats:', error);
            throw error;
        }
    }

    // 📤 Exportar favoritos (útil para backup)
    async exportFavorites() {
        try {
            const { data, error } = await supabase
                .from('favorites')
                .select(`
                    *,
                    category:favorites_categories(*),
                    conversation:conversations(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error exporting favorites:', error);
            throw error;
        }
    }
}

export default new FavoritesService();