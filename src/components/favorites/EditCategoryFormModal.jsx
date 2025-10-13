import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FavoritesCategoriesService from '../../services/FavoritesCategoriesService';

const EditCategoryFormModal = ({ visible, onClose, onSubmit, category }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('⭐');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [loading, setLoading] = useState(false);

    const presetIcons = FavoritesCategoriesService.getPresetIcons();
    const presetColors = FavoritesCategoriesService.getPresetColors();

    // Cargar datos de la categoría cuando se abre el modal
    useEffect(() => {
        // console.log('EditCategoryFormModal useEffect triggered:', { visible, category });
        if (visible) {
            if (category) {
                console.log('Setting category data:', {
                    name: category.name,
                    description: category.description,
                    icon: category.icon,
                    color: category.color
                });
                setName(category.name || '');
                setDescription(category.description || '');
                setSelectedIcon(category.icon || '⭐');
                setSelectedColor(category.color || '#3B82F6');
            } else {
                console.log('No category provided, using defaults');
                setName('');
                setDescription('');
                setSelectedIcon('⭐');
                setSelectedColor('#3B82F6');
            }
        }
    }, [visible, category]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre de la categoría es obligatorio');
            return;
        }

        if (name.length > 50) {
            Alert.alert('Error', 'El nombre no puede tener más de 50 caracteres');
            return;
        }

        try {
            setLoading(true);
            await onSubmit({
                name: name.trim(),
                description: description.trim() || null,
                icon: selectedIcon,
                color: selectedColor
            });
        } catch (error) {
            console.error('Error updating category:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
        }
    };

    if (!visible) return null;

    // console.log('EditCategoryFormModal render - Current state:', {
    //     name,
    //     description,
    //     selectedIcon,
    //     selectedColor,
    //     category
    // });

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-white px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={handleClose} disabled={loading}>
                            <Text className="text-blue-600 text-lg">Cancelar</Text>
                        </TouchableOpacity>
                        <Text className="text-lg font-semibold text-gray-900">
                            Editar Categoría
                        </Text>
                        <TouchableOpacity 
                            onPress={handleSubmit} 
                            disabled={loading || !name.trim()}
                        >
                            <Text className={`text-lg ${loading || !name.trim() ? 'text-gray-400' : 'text-blue-600'}`}>
                                {loading ? 'Guardando...' : 'Guardar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                    {/* Nombre */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Nombre de la categoría</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Consejos de alimentación"
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                            maxLength={50}
                            editable={!loading}
                        />
                        <Text className="text-gray-500 text-sm mt-1">{name.length}/50</Text>
                    </View>

                    {/* Descripción */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Descripción (opcional)</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe brevemente esta categoría..."
                            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            maxLength={200}
                            editable={!loading}
                        />
                        <Text className="text-gray-500 text-sm mt-1">{description.length}/200</Text>
                    </View>

                    {/* Icono */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-3">Icono</Text>
                        <View className="flex-row flex-wrap">
                            {presetIcons.map((icon, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedIcon(icon)}
                                    disabled={loading}
                                    className={`w-12 h-12 rounded-lg mr-3 mb-3 items-center justify-center ${
                                        selectedIcon === icon ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'
                                    }`}
                                >
                                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Color */}
                    <View className="mb-8">
                        <Text className="text-gray-700 font-medium mb-3">Color</Text>
                        <View className="flex-row flex-wrap">
                            {presetColors.map((color, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedColor(color)}
                                    disabled={loading}
                                    className={`w-10 h-10 rounded-full mr-3 mb-3 ${
                                        selectedColor === color ? 'border-4 border-gray-400' : 'border border-gray-200'
                                    }`}
                                    style={{ backgroundColor: color }}
                                >
                                    {selectedColor === color && (
                                        <View className="flex-1 items-center justify-center">
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

export default EditCategoryFormModal;