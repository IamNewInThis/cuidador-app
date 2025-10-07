import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ChatOptionsModal = ({ visible, onClose, onAddToFavorites, messageId }) => {
    const handleAddToFavorites = () => {
        if (onAddToFavorites) {
            onAddToFavorites(messageId);
        }
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                {/* Overlay para cerrar */}
                <TouchableOpacity 
                    className="flex-1" 
                    onPress={onClose}
                    activeOpacity={1}
                />
                
                {/* Bottom Sheet */}
                <View className="bg-white rounded-t-3xl overflow-hidden">
                    {/* Handle bar */}
                    <View className="items-center py-3">
                        <View className="w-12 h-1 bg-gray-300 rounded-full" />
                    </View>

                    {/* Header */}
                    <View className="px-6 pb-4">
                        <Text className="text-lg font-semibold text-gray-900 text-center">
                            Opciones del mensaje
                        </Text>
                    </View>

                    {/* Opciones */}
                    <View className="pb-8">
                        <TouchableOpacity
                            onPress={handleAddToFavorites}
                            className="flex-row items-center px-6 py-4 active:bg-gray-50"
                        >
                            <View className="w-10 h-10 items-center justify-center mr-4 bg-gray-100 rounded-full">
                                <Feather name="star" size={20} color="#6B7280" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-base font-medium text-gray-900">
                                    Agregar a favoritos
                                </Text>
                                <Text className="text-sm text-gray-500 mt-1">
                                    Guarda este mensaje para encontrarlo fácilmente
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Safe area para dispositivos con notch */}
                    <View className="pb-4" />
                </View>
            </View>
        </Modal>
    );
};

export default ChatOptionsModal;