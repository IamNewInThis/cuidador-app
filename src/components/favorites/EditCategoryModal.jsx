import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EditCategoryModal = ({ visible, onClose, onEdit, onDelete, category }) => {
    const [loading, setLoading] = useState(false);

    const handleEdit = async () => {
        try {
            setLoading(true);
            onClose();
            await onEdit();
        } catch (error) {
            console.error('Error editing category:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        onClose();
        Alert.alert(
            'Eliminar categoría',
            `¿Estás seguro de que quieres eliminar la categoría "${category?.name}"? Esta acción eliminará la categoría y todos sus favoritos asociados.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: onDelete
                }
            ]
        );
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <TouchableOpacity 
                className="flex-1 bg-black bg-opacity-50 justify-end"
                activeOpacity={1}
                onPress={onClose}
            >
                <View className="bg-white rounded-t-3xl">
                    {/* Handle indicator */}
                    <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
                    
                    {/* Category info */}
                    <View className="px-6 pb-4 border-b border-gray-100">
                        <View className="flex-row items-center">
                            <View 
                                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                                style={{ backgroundColor: category?.color + '20' }}
                            >
                                <Text style={{ fontSize: 20, color: category?.color }}>
                                    {category?.icon}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-semibold text-gray-900">
                                    {category?.name}
                                </Text>
                                {category?.description && (
                                    <Text className="text-sm text-gray-500 mt-1">
                                        {category?.description}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="px-4 py-2">
                        <TouchableOpacity
                            onPress={handleEdit}
                            disabled={loading}
                            className="flex-row items-center px-4 py-4 active:bg-gray-50"
                        >
                            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-medium text-gray-900">
                                    Editar categoría
                                </Text>
                                <Text className="text-sm text-gray-500 mt-1">
                                    Modificar nombre, descripción, icono y color
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {!category?.is_default && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                disabled={loading}
                                className="flex-row items-center px-4 py-4 active:bg-gray-50"
                            >
                                <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-4">
                                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-medium text-red-600">
                                        Eliminar categoría
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-1">
                                        Esta acción eliminará la categoría y todos sus favoritos
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Cancel button */}
                    <View className="px-4 pt-2 pb-6">
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={loading}
                            className="bg-gray-100 rounded-xl py-4"
                        >
                            <Text className="text-gray-700 font-semibold text-center text-base">
                                Cancelar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

export default EditCategoryModal;