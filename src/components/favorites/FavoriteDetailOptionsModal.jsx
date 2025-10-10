import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FavoritesCategoriesService from '../../services/FavoritesCategoriesService';
import FavoritesService from '../../services/FavoritesService';

const CategorySelectionModal = ({ visible, onClose, categories, selectedCategoryId, onSelect }) => {
    console.log('CategorySelectionModal rendered:', { visible, categoriesCount: categories?.length });
    
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                <View className="bg-white px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={onClose}>
                            <Text className="text-blue-600 text-lg">Cancelar</Text>
                        </TouchableOpacity>
                        <Text className="text-lg font-semibold text-gray-900">
                            Seleccionar categoría
                        </Text>
                        <View style={{ width: 70 }} />
                    </View>
                </View>
                
                <ScrollView className="flex-1 px-4 py-6">
                    {categories?.length === 0 && (
                        <View className="flex-1 justify-center items-center py-20">
                            <Text className="text-gray-500 text-base">
                                No hay categorías disponibles
                            </Text>
                        </View>
                    )}
                    {categories?.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => onSelect(cat)}
                            className={`flex-row items-center p-4 rounded-xl mb-3 ${
                                selectedCategoryId === cat.id ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                            }`}
                        >
                            <View 
                                className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                                style={{ backgroundColor: cat.color + '20' }}
                            >
                                <Text style={{ fontSize: 24, color: cat.color }}>
                                    {cat.icon}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-base ${selectedCategoryId === cat.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {cat.name}
                                </Text>
                                {cat.description && (
                                    <Text className={`text-sm mt-1 ${selectedCategoryId === cat.id ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {cat.description}
                                    </Text>
                                )}
                                <Text className="text-xs text-gray-400 mt-1">
                                    {cat.favorites_count} favoritos
                                </Text>
                            </View>
                            {selectedCategoryId === cat.id && (
                                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </Modal>
    );
};

const FavoriteDetailOptionsModal = ({ 
    visible, 
    onClose, 
    favorite, 
    onUpdate, 
    onRemove, 
    onDelete,
    onCategoryChange,
    currentCategoryId, 
    babyId,
    category: initialCategory
}) => {
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const { conversation, custom_title, notes, created_at, category: favoriteCategory } = favorite || {};
    const messageContent = conversation?.content || '';
    const isUserMessage = conversation?.role === 'user';
    const babyName = conversation?.baby?.name;

    // Truncar contenido para el preview
    const truncatedContent = messageContent.length > 200 
        ? messageContent.substring(0, 200) + '...' 
        : messageContent;

    useEffect(() => {
        if (visible) {
            loadCategories();
            setSelectedCategoryId(currentCategoryId);
        }
    }, [visible, currentCategoryId]);

    const loadCategories = async () => {
        try {
            // Usar babyId si está disponible para obtener categorías específicas del bebé
            console.log('Loading categories for babyId:', babyId);
            const data = await FavoritesCategoriesService.getCategoriesWithStats(babyId);
            console.log('Categories loaded:', data);
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCategorySelect = (selectedCategory) => {
        setSelectedCategoryId(selectedCategory.id);
        setShowCategoryModal(false);
        handleCategoryChange(selectedCategory.id);
    };

    const handleCategoryChange = async (newCategoryId) => {
        const categoryIdToUse = newCategoryId || selectedCategoryId;
        if (categoryIdToUse === currentCategoryId || !categoryIdToUse) return;
        
        setLoading(true);
        try {
            await FavoritesService.updateFavorite(favorite.id, {
                category_id: categoryIdToUse
            });
            
            onCategoryChange?.(categoryIdToUse);
            onClose();
        } catch (error) {
            console.error('Error changing category:', error);
            Alert.alert('Error', 'No se pudo cambiar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Eliminar favorito',
            '¿Estás seguro de que quieres eliminar este favorito? Esta acción no se puede deshacer.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await FavoritesService.deleteFavorite(favorite.id);
                            onDelete?.(favorite.id);
                            onClose();
                        } catch (error) {
                            console.error('Error deleting favorite:', error);
                            Alert.alert('Error', 'No se pudo eliminar el favorito');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (!visible || !favorite) return null;

    // Encontrar la categoría actual para mostrar su información
    const currentCategory = categories.find(cat => cat.id === currentCategoryId) || favoriteCategory || initialCategory;
    
    // Debug log para verificar la estructura
    console.log('Debug Modal:', {
        currentCategoryId,
        favoriteCategory,
        initialCategory,
        currentCategory,
        categoriesCount: categories.length
    });

    return (
        <>
            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <View className="flex-1 bg-gray-50">
                    {/* Header */}
                    <View className="bg-white px-6 py-4 border-b border-gray-200">
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity onPress={onClose} disabled={loading}>
                                <Text className="text-blue-600 text-lg">Cerrar</Text>
                            </TouchableOpacity>
                            <Text className="text-lg font-semibold text-gray-900">
                                Opciones del favorito
                            </Text>
                            <View style={{ width: 50 }} />
                        </View>
                    </View>

                    <ScrollView className="flex-1">
                        {/* Preview del mensaje estilo Pinterest */}
                        <View className="bg-white mx-4 mt-6 mb-6 rounded-2xl shadow-sm border border-gray-100">
                            {/* Header del mensaje */}
                            <View className="p-4 border-b border-gray-100">
                                <View className="flex-row items-center mb-3">
                                    <View 
                                        className="w-12 h-12 rounded-full items-center justify-center mr-3"
                                        style={{ backgroundColor: isUserMessage ? '#3B82F6' : '#10B981' }}
                                    >
                                        <Text className="text-white text-lg font-bold">
                                            {isUserMessage ? '👤' : '🤖'}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-semibold">
                                            {isUserMessage ? 'Tu pregunta' : 'Respuesta de Lumi'}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">
                                            {formatFullDate(created_at)}
                                            {babyName && ` • ${babyName}`}
                                        </Text>
                                    </View>
                                </View>
                                
                                {custom_title && (
                                    <Text className="text-gray-900 font-semibold text-lg mb-2">
                                        {custom_title}
                                    </Text>
                                )}
                            </View>

                            {/* Contenido del mensaje (truncado) */}
                            <View className="p-4">
                                <Text className="text-gray-700 text-base leading-6">
                                    {truncatedContent}
                                </Text>
                                
                                {messageContent.length > 200 && (
                                    <Text className="text-blue-600 text-sm mt-2 font-medium">
                                        Ver mensaje completo...
                                    </Text>
                                )}
                                
                                {notes && (
                                    <View className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <View className="flex-row items-start">
                                            <Text className="text-yellow-600 mr-2">📝</Text>
                                            <Text className="text-yellow-800 flex-1 text-sm">
                                                {notes}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Cambiar categoría */}
                        <View className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100">
                            <TouchableOpacity
                                onPress={() => setShowCategoryModal(true)}
                                disabled={loading}
                                className="p-4"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View 
                                            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                                            style={{ backgroundColor: currentCategory?.color + '20' || '#E5E7EB' }}
                                        >
                                            <Text style={{ fontSize: 24, color: currentCategory?.color || '#6B7280' }}>
                                                {currentCategory?.icon || '📁'}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-semibold text-base">
                                                {currentCategory?.name || 'Categoría'}
                                            </Text>
                                            <Text className="text-gray-500 text-sm mt-1">
                                                Cambiar categoría del favorito
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Eliminar favorito */}
                        <View className="bg-white mx-4 mb-6 rounded-2xl shadow-sm border border-gray-100">
                            <TouchableOpacity
                                onPress={handleDelete}
                                disabled={loading}
                                className="p-4"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-red-50">
                                        <Ionicons name="trash-outline" size={24} color="#DC2626" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-red-600 font-semibold text-base">
                                            Eliminar favorito
                                        </Text>
                                        <Text className="text-gray-500 text-sm mt-1">
                                            Esta acción no se puede deshacer
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal de selección de categoría */}
            <CategorySelectionModal
                visible={showCategoryModal}
                categories={categories}
                selectedCategoryId={currentCategoryId}
                onSelect={handleCategorySelect}
                onClose={() => setShowCategoryModal(false)}
                loading={loading}
            />
        </>
    );
};

export default FavoriteDetailOptionsModal;