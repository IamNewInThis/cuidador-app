import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FavoritesCategoriesService from '../../services/FavoritesCategoriesService';

const SelectCategoryModal = ({ visible, onClose, onSelectCategory, messageId }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    useEffect(() => {
        if (visible) {
            loadCategories();
        }
    }, [visible]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await FavoritesCategoriesService.getUserCategories();
            setCategories(data);
            // Seleccionar la categoría por defecto automáticamente
            const defaultCategory = data.find(cat => cat.is_default);
            if (defaultCategory) {
                setSelectedCategoryId(defaultCategory.id);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            Alert.alert('Error', 'No se pudieron cargar las categorías');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCategory = () => {
        if (!selectedCategoryId) {
            Alert.alert('Error', 'Por favor selecciona una categoría');
            return;
        }
        onSelectCategory(selectedCategoryId);
        onClose();
    };

    const renderCategoryItem = ({ item }) => {
        const isSelected = selectedCategoryId === item.id;
        
        return (
            <TouchableOpacity
                onPress={() => setSelectedCategoryId(item.id)}
                className={`flex-row items-center p-4 mb-2 rounded-xl border-2 ${
                    isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                }`}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                }}
            >
                {/* Icono de la categoría */}
                <View 
                    className="w-12 h-12 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: item.color + '20' }}
                >
                    <Text className="text-lg">{item.icon}</Text>
                </View>

                {/* Información de la categoría */}
                <View className="flex-1">
                    <Text className={`font-semibold text-base ${
                        isSelected ? 'text-blue-700' : 'text-gray-800'
                    }`}>
                        {item.name}
                    </Text>
                    {item.description && (
                        <Text className={`text-sm mt-1 ${
                            isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                            {item.description}
                        </Text>
                    )}
                    <Text className={`text-xs mt-1 ${
                        isSelected ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                        {item.favorites_count?.[0]?.count || 0} mensajes
                    </Text>
                </View>

                {/* Indicador de selección */}
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                }`}>
                    {isSelected && (
                        <Ionicons name="checkmark" size={14} color="white" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-lg color-blue-500">Cancelar</Text>
                    </TouchableOpacity>
                    
                    <Text className="text-lg font-semibold text-gray-800">
                        Guardar en categoría
                    </Text>
                    
                    <TouchableOpacity 
                        onPress={handleSelectCategory}
                        disabled={!selectedCategoryId}
                        className={selectedCategoryId ? '' : 'opacity-50'}
                    >
                        <Text className="text-lg font-semibold color-blue-500">
                            Guardar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Contenido */}
                <View className="flex-1 p-4">
                    <Text className="text-center text-gray-600 mb-4">
                        Selecciona la categoría donde quieres guardar este mensaje
                    </Text>

                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text className="text-gray-500 mt-2">Cargando categorías...</Text>
                        </View>
                    ) : categories.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="folder-outline" size={64} color="#9CA3AF" />
                            <Text className="text-gray-500 text-center mt-4">
                                No tienes categorías creadas
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={categories}
                            renderItem={renderCategoryItem}
                            keyExtractor={(item) => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default SelectCategoryModal;