import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import FavoritesCategoriesService from '../services/FavoritesCategoriesService';
import CreateCategoryModal from '../components/favorites/CreateCategoryModal';
import CategoryCard from '../components/favorites/CategoryCard';
import { useTranslation } from 'react-i18next';

const FavoritesView = ({ navigation }) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await FavoritesCategoriesService.getCategoriesWithStats();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadCategories();
    };

    const handleCreateCategory = async (categoryData) => {
        try {
            await FavoritesCategoriesService.createCategory(categoryData);
            setShowCreateModal(false);
            loadCategories(); // Recargar categorías
        } catch (error) {
            console.error('Error creating category:', error);
            Alert.alert('Error', 'No se pudo crear la categoría');
        }
    };

    const handleCategoryPress = (category) => {
        navigation.navigate('CategoryDetail', { 
            categoryId: category.id, 
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon
        });
    };

    const handleEditCategory = (category) => {
        navigation.navigate('EditCategory', { category });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <Ionicons name="heart" size={48} color="#3B82F6" />
                    <Text className="text-gray-500 mt-4">{t('favorites.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">{t('favorites.title')}</Text>
                        <Text className="text-gray-500 mt-1">
                            {categories.length} {categories.length === 1 ? t('favorites.category') : t('favorites.categories')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowCreateModal(true)}
                        className="bg-blue-600 rounded-full p-3"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Categories Grid */}
            <ScrollView 
                className="flex-1 px-4 py-6"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                    />
                }
            >
                {categories.length === 0 ? (
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
                        <Text className="text-gray-500 text-lg font-medium mt-4">{t('favorites.noCategories')}</Text>
                        <Text className="text-gray-400 text-center mt-2 px-8">
                            {t('favorites.noCategoriesDesc')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            className="bg-blue-600 rounded-lg px-6 py-3 mt-6"
                        >
                            <Text className="text-white font-semibold">{t('favorites.createCategory')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="flex-row flex-wrap justify-between">
                        {categories.map((category, index) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                onPress={() => handleCategoryPress(category)}
                                onEdit={() => handleEditCategory(category)}
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

            {/* Create Category Modal */}
            <CreateCategoryModal
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateCategory}
            />
        </SafeAreaView>
    );
};

export default FavoritesView;
