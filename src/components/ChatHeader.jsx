import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ChatHeader = ({ babyName = "Martín", onMenuPress, onSearchPress }) => {
    return (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                {/* Botón de menú */}
                <TouchableOpacity
                    onPress={onMenuPress}
                    className="p-2 -ml-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="menu" size={24} color="#374151" />
                </TouchableOpacity>

                {/* Nombre del bebé */}
                <View className="flex-1 items-center">
                    <Text className="text-lg font-semibold text-gray-900">
                        {babyName}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Text className="text-xs text-gray-500">
                            Chat con Lumi
                        </Text>
                    </View>
                </View>

                {/* Botón de búsqueda */}
                <TouchableOpacity
                    onPress={onSearchPress}
                    className="p-2 -mr-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="search" size={24} color="#374151" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ChatHeader;