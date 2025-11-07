import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';

const ChatHeader = ({ babyName = "", onMenuPress, onSearchPress, onBabyPress }) => {
    return (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row items-center justify-between">
                {/* Lado izquierdo: Menú + Nombre del bebé */}
                <View className="flex-row items-center flex-1">
                    {/* Botón de menú */}
                    <TouchableOpacity
                        onPress={onMenuPress}
                        className="p-2 -ml-2 mr-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="menu" size={24} color="#374151" />
                    </TouchableOpacity>

                    {/* Nombre del bebé clickeable */}
                    <TouchableOpacity
                        onPress={onBabyPress}
                        className="flex-row items-center flex-1"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text className="text-lg font-semibold text-gray-900 mr-1">
                            {babyName}
                        </Text>
                        <Entypo name="chevron-small-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
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