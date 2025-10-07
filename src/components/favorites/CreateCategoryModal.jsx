import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FavoritesCategoriesService from '../../services/FavoritesCategoriesService';

const CreateCategoryModal = ({ visible, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('⭐');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [loading, setLoading] = useState(false);

    const presetIcons = FavoritesCategoriesService.getPresetIcons();
    const presetColors = FavoritesCategoriesService.getPresetColors();

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
            
            // Limpiar form
            setName('');
            setDescription('');
            setSelectedIcon('⭐');
            setSelectedColor('#3B82F6');
        } catch (error) {
            console.error('Error creating category:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setSelectedIcon('⭐');
        setSelectedColor('#3B82F6');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="bg-white px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={handleClose}>
                            <Text className="text-blue-600 text-lg">Cancelar</Text>
                        </TouchableOpacity>
                        <Text className="text-xl font-semibold text-gray-900">Nueva Categoría</Text>
                        <TouchableOpacity 
                            onPress={handleSubmit}
                            disabled={loading || !name.trim()}
                            className={`${!name.trim() || loading ? 'opacity-50' : ''}`}
                        >
                            <Text className="text-blue-600 text-lg font-semibold">
                                {loading ? 'Creando...' : 'Crear'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                    {/* Preview */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-3">Vista previa</Text>
                        <View className="bg-gray-50 rounded-2xl p-4">
                            <View className="flex-row items-center">
                                <View 
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: selectedColor + '20' }}
                                >
                                    <Text style={{ fontSize: 24, color: selectedColor }}>{selectedIcon}</Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-semibold text-lg">
                                        {name || 'Nombre de la categoría'}
                                    </Text>
                                    {description && (
                                        <Text className="text-gray-500 text-sm mt-1">
                                            {description}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Nombre */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Nombre *</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Cocina, Regalos, Consejos..."
                            className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                            maxLength={50}
                        />
                        <Text className="text-gray-400 text-sm mt-1">
                            {name.length}/50 caracteres
                        </Text>
                    </View>

                    {/* Descripción */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Descripción (opcional)</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Breve descripción de la categoría..."
                            className="bg-gray-50 rounded-lg px-4 py-3 text-gray-900"
                            multiline
                            numberOfLines={3}
                            maxLength={200}
                        />
                        <Text className="text-gray-400 text-sm mt-1">
                            {description.length}/200 caracteres
                        </Text>
                    </View>

                    {/* Icono */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-3">Icono</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row space-x-3">
                                {presetIcons.map((icon, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedIcon(icon)}
                                        className={`w-12 h-12 rounded-xl items-center justify-center ${
                                            selectedIcon === icon ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'
                                        }`}
                                    >
                                        <Text style={{ fontSize: 20 }}>{icon}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Color */}
                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-3">Color</Text>
                        <View className="flex-row flex-wrap">
                            {presetColors.map((color, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedColor(color)}
                                    className={`w-12 h-12 rounded-xl mr-3 mb-3 items-center justify-center ${
                                        selectedColor === color ? 'border-2 border-gray-400' : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                >
                                    {selectedColor === color && (
                                        <Ionicons name="checkmark" size={20} color="white" />
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

export default CreateCategoryModal;