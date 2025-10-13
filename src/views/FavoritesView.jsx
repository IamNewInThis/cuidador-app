import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import FavoritesCategoriesService from '../services/FavoritesCategoriesService';
import { getBabies } from '../services/BabiesService';
import CreateCategoryModal from '../components/favorites/CreateCategoryModal';
import EditCategoryModal from '../components/favorites/EditCategoryModal';
import EditCategoryFormModal from '../components/favorites/EditCategoryFormModal';
import CategoryCard from '../components/favorites/CategoryCard';
import SideMenu from '../components/SideMenu';
import { useTranslation } from 'react-i18next';

const formatBabyAge = (birthdate) => {
    if (!birthdate) return '';

    const parsedDate = new Date(birthdate);
    if (Number.isNaN(parsedDate.getTime())) {
        return '';
    }

    const now = new Date();
    let years = now.getFullYear() - parsedDate.getFullYear();
    let months = now.getMonth() - parsedDate.getMonth();

    if (now.getDate() < parsedDate.getDate()) {
        months -= 1;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    years = Math.max(years, 0);
    months = Math.max(months, 0);

    if (years > 0 && months > 0) {
        return `${years} año${years !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}`;
    } else if (years > 0) {
        return `${years} año${years !== 1 ? 's' : ''}`;
    } else if (months > 0) {
        return `${months} mes${months !== 1 ? 'es' : ''}`;
    } else {
        return 'Recién nacido';
    }
};

const FavoritesView = ({ navigation }) => {
    const { user, signOut } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showEditFormModal, setShowEditFormModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryForEdit, setCategoryForEdit] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [selectedBaby, setSelectedBaby] = useState(null);
    const { t } = useTranslation();

    // Calcular edad del bebé seleccionado
    const selectedBabyAge = selectedBaby?.birthdate ? formatBabyAge(selectedBaby.birthdate) : '';

    // ✅ Obtener bebé seleccionado al enfocar la pantalla
    useFocusEffect(
        React.useCallback(() => {
            loadSelectedBaby();
        }, [])
    );

    useEffect(() => {
        loadCategories();
    }, [selectedBaby]);

    const loadSelectedBaby = async () => {
        try {
            // Primero intentar con la key específica del usuario (usado en Chat)
            let babyData = await AsyncStorage.getItem(`selectedBaby_${user?.id}`);
            // console.log('Baby data from user-specific key:', babyData);
            
            if (babyData) {
                // Es un ID, necesitamos buscar el bebé completo
                try {
                    const { data: babies } = await getBabies(user.id);
                    const selectedBabyData = babies.find(baby => baby.id === babyData);
                    if (selectedBabyData) {
                        // console.log('Found complete baby data:', selectedBabyData);
                        setSelectedBaby(selectedBabyData);
                        // Guardar también en la key general para consistencia
                        await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBabyData));
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching baby by ID:', error);
                }
            }
            
            // Si no se encontró con la key específica, intentar con la key general
            babyData = await AsyncStorage.getItem('selectedBaby');
            // console.log('Baby data from general key:', babyData);
            
            if (babyData) {
                const parsedBaby = JSON.parse(babyData);
                console.log('Parsed baby data:', parsedBaby);
                setSelectedBaby(parsedBaby);
            } else {
                console.log('No baby selected, loading global categories');
                // Si no hay bebé seleccionado, cargar categorías globales
                loadCategories();
            }
        } catch (error) {
            console.error('Error loading selected baby:', error);
            // En caso de error, intentar cargar categorías sin bebé específico
            loadCategories();
        }
    };

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await FavoritesCategoriesService.getCategoriesWithStats(selectedBaby?.id);
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
            console.log('Creating category for baby:', selectedBaby?.name, 'ID:', selectedBaby?.id);
            
            await FavoritesCategoriesService.createCategory({
                ...categoryData,
                babyId: selectedBaby?.id // ✅ Incluir baby_id
            });
            setShowCreateModal(false);
            loadCategories(); // Recargar categorías
        } catch (error) {
            console.error('Error creating category:', error);
            Alert.alert('Error', 'No se pudo crear la categoría');
        }
    };

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setShowEditModal(true);
    };

    const handleEditCategoryForm = () => {
        console.log('Storing category for edit:', selectedCategory);
        setCategoryForEdit(selectedCategory); // Almacenar la categoría antes de abrir el modal
        setShowEditModal(false);
        setShowEditFormModal(true);
    };

    const handleUpdateCategory = async (categoryData) => {
        try {
            console.log('Updating category with ID:', categoryForEdit?.id || selectedCategory?.id);
            const categoryToUpdate = categoryForEdit || selectedCategory;
            await FavoritesCategoriesService.updateCategory(categoryToUpdate.id, categoryData);
            setShowEditFormModal(false);
            setSelectedCategory(null);
            setCategoryForEdit(null);
            loadCategories(); // Recargar categorías
            Alert.alert('Éxito', 'Categoría actualizada correctamente');
        } catch (error) {
            console.error('Error updating category:', error);
            Alert.alert('Error', 'No se pudo actualizar la categoría');
        }
    };

    const handleDeleteCategory = async () => {
        try {
            await FavoritesCategoriesService.deleteCategory(selectedCategory.id);
            setShowEditModal(false);
            setSelectedCategory(null);
            loadCategories(); // Recargar categorías
            Alert.alert('Éxito', 'Categoría eliminada correctamente');
        } catch (error) {
            console.error('Error deleting category:', error);
            if (error.message.includes('categoría por defecto')) {
                Alert.alert('Error', 'No se puede eliminar la categoría por defecto');
            } else {
                Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
        }
    };

    const handleCategoryPress = (category) => {
        navigation.navigate('CategoryDetail', { 
            categoryId: category.id, 
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon,
            babyId: selectedBaby?.id // ✅ Incluir baby_id
        });
    };

    // Menu functions
    const handleMenuPress = () => {
        setIsMenuVisible(true);
    };

    const handleCloseMenu = () => {
        setIsMenuVisible(false);
    };

    const handleNavigateToChat = () => {
        navigation.navigate('Chat');
    };

    const handleNavigateToProfile = () => {
        if (selectedBaby) {
            navigation.navigate('BabyDetail', { baby: selectedBaby });
        } else {
            // Si no hay bebé seleccionado, ir a la lista de bebés
            navigation.navigate('Babies');
        }
    };

    const handleNavigateToAccount = async () => {
        try {
            // Asegurar que el bebé seleccionado esté guardado en AsyncStorage
            if (selectedBaby && user) {
                await AsyncStorage.setItem(`selectedBaby_${user.id}`, selectedBaby.id);
                await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBaby));
                console.log('Baby saved before navigating to ProfileSettings:', selectedBaby.name);
            }
            navigation.navigate('ProfileSettings');
        } catch (error) {
            console.error('Error saving baby before navigation to ProfileSettings:', error);
            navigation.navigate('ProfileSettings');
        }
    };

    const handleNavigateToCreateBaby = () => {
        navigation.navigate('Babies');
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
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
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={handleMenuPress}
                            className="p-2 -ml-2 mr-3"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="menu" size={24} color="#374151" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-gray-900">{t('favorites.title')}</Text>
                            <Text className="text-gray-500 mt-1">
                                {categories.length} {categories.length === 1 ? t('favorites.category') : t('favorites.categories')}
                            </Text>
                        </View>
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

            {/* Edit Category Action Modal */}
            <EditCategoryModal
                visible={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedCategory(null);
                    setCategoryForEdit(null);
                }}
                onEdit={handleEditCategoryForm}
                onDelete={handleDeleteCategory}
                category={selectedCategory}
            />

            {/* Edit Category Form Modal */}
            <EditCategoryFormModal
                visible={showEditFormModal}
                onClose={() => {
                    setShowEditFormModal(false);
                    setSelectedCategory(null);
                    setCategoryForEdit(null);
                }}
                onSubmit={handleUpdateCategory}
                category={categoryForEdit}
            />

            {/* Side Menu */}
            <SideMenu
                visible={isMenuVisible}
                onClose={handleCloseMenu}
                onChangeBaby={() => navigation.navigate('BabyList')}
                onNavigateToChat={handleNavigateToChat}
                onNavigateToFavorites={() => {}} // Ya estamos aquí
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToAccount={handleNavigateToAccount}
                onNavigateToCreateBaby={handleNavigateToCreateBaby}
                onLogout={handleLogout}
                babyName={selectedBaby?.name || "Sin seleccionar"}
                babyAgeLabel={selectedBabyAge}
            />
        </SafeAreaView>
    );
};

export default FavoritesView;
