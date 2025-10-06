import React from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';

const BabySelectionModal = ({ visible, babies, selectedBaby, onSelectBaby, onClose }) => {
    const renderBabyItem = ({ item }) => (
        <TouchableOpacity
            className={`p-4 border-b border-gray-100 ${
                selectedBaby?.id === item.id ? 'bg-blue-50' : 'bg-white'
            }`}
            onPress={() => onSelectBaby(item)}
        >
            <View className="flex-row items-center justify-between">
                <View>
                    <Text className={`text-lg font-medium ${
                        selectedBaby?.id === item.id ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                        {item.name}
                    </Text>
                    {item.birthdate && (
                        <Text className="text-sm text-gray-500 mt-1">
                            Nacido: {new Date(item.birthdate).toLocaleDateString()}
                        </Text>
                    )}
                </View>
                {selectedBaby?.id === item.id && (
                    <Feather name="check" size={20} color="#2563EB" />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-white rounded-2xl mx-4 w-80 max-h-96 overflow-hidden">
                    {/* Header del modal */}
                    <View className="p-4 border-b border-gray-200">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-semibold text-gray-900">
                                Seleccionar bebé
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Feather name="x" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Lista de bebés */}
                    <FlatList
                        data={babies}
                        renderItem={renderBabyItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default BabySelectionModal;