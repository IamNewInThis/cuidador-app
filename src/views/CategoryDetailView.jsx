import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import FavoritesService from '../services/FavoritesService';
import FavoriteMessageCard from '../components/favorites/FavoriteMessageCard';
import FavoriteDetailModal from '../components/favorites/FavoriteDetailModal';
import FavoriteDetailOptionsModal from '../components/favorites/FavoriteDetailOptionsModal';
import { useTranslation } from 'react-i18next';

const CategoryDetailView = ({ route, navigation }) => {
    const { categoryId, categoryName, categoryColor, categoryIcon, babyId } = route.params;
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFavorite, setSelectedFavorite] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const { t } = useTranslation();

    // Construir objeto de categoría desde los parámetros de la ruta
    const category = {
        id: categoryId,
        name: categoryName,
        color: categoryColor,
        icon: categoryIcon
    };

    useEffect(() => {
        loadFavorites();
    }, [categoryId, babyId]);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const data = await FavoritesService.getUserFavorites(categoryId, babyId);
            setFavorites(data);
        } catch (error) {
            console.error('Error loading favorites:', error);
            Alert.alert('Error', 'No se pudieron cargar los favoritos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadFavorites();
    };

    const handleFavoritePress = (favorite) => {
        setSelectedFavorite(favorite);
        setShowDetailModal(true);
    };

    const handleFavoriteOptions = (favorite) => {
        setSelectedFavorite(favorite);
        setShowOptionsModal(true);
    };

    const handleUpdateFavoriteCategory = async (newCategoryId) => {
        // Aquí implementarías la lógica para actualizar la categoría del favorito
        // Por ahora solo recargamos la lista
        loadFavorites();
    };

    const handleRemoveFavorite = async (favoriteId) => {
        try {
            await FavoritesService.deleteFavoriteById(favoriteId);
            setFavorites(favorites.filter(f => f.id !== favoriteId));
            setShowDetailModal(false);
            setSelectedFavorite(null);
            Alert.alert('Éxito', 'Favorito eliminado correctamente');
        } catch (error) {
            console.error('Error removing favorite:', error);
            Alert.alert('Error', 'No se pudo eliminar el favorito');
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <View 
                        className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                        style={{ backgroundColor: categoryColor + '20' }}
                    >
                        <Text style={{ fontSize: 32, color: categoryColor }}>{categoryIcon}</Text>
                    </View>
                    <Text className="text-gray-500">Cargando favoritos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="flex-row items-center"
                    >
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                        <Text className="text-gray-600 ml-1">{t('favorites.title')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity className="p-2">
                        <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
                
                <View className="flex-row items-center mt-3">
                    <View 
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: categoryColor + '20' }}
                    >
                        <Text style={{ fontSize: 24, color: categoryColor }}>{categoryIcon}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">{categoryName}</Text>
                        <Text className="text-gray-500">
                            {favorites.length} {favorites.length === 1 ? t('favorites.favorite') : t('favorites.title')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView 
                className="flex-1 px-4 py-6"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[categoryColor]}
                        tintColor={categoryColor}
                    />
                }
            >
                {favorites.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <View 
                            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
                            style={{ backgroundColor: categoryColor + '10' }}
                        >
                            <Text style={{ fontSize: 40, color: categoryColor }}>{categoryIcon}</Text>
                        </View>
                        <Text className="text-gray-500 text-lg font-medium">{t('favorites.noFavorites')}</Text>
                        <Text className="text-gray-400 text-center mt-2 px-8">
                            {t('favorites.noFavoritesDesc')}
                        </Text>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between">
                        {favorites.map((favorite, index) => (
                            <FavoriteMessageCard
                                key={favorite.id}
                                favorite={favorite}
                                onPress={() => handleFavoritePress(favorite)}
                                onOptions={handleFavoriteOptions}
                                categoryColor={categoryColor}
                                style={{ 
                                    width: '48%', 
                                    marginBottom: 16,
                                    marginRight: index % 2 === 0 ? '4%' : 0
                                }}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Detail Modal */}
            <FavoriteDetailModal
                visible={showDetailModal}
                favorite={selectedFavorite}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedFavorite(null);
                }}
                onRemove={handleRemoveFavorite}
                categoryColor={categoryColor}
            />

            {/* Options Modal */}
            <FavoriteDetailOptionsModal
                visible={showOptionsModal}
                favorite={selectedFavorite}
                onClose={() => {
                    setShowOptionsModal(false);
                    setSelectedFavorite(null);
                }}
                onUpdate={handleUpdateFavoriteCategory}
                onRemove={handleRemoveFavorite}
                onDelete={handleRemoveFavorite}
                onCategoryChange={handleUpdateFavoriteCategory}
                currentCategoryId={categoryId}
                babyId={babyId}
                category={category}
            />
        </SafeAreaView>
    );
};

export default CategoryDetailView;