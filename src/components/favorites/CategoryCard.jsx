import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CategoryCard = ({ category, onPress, onEdit, style }) => {
    const { name, description, icon, color, favorites_count, is_default } = category;

    const handleOptionsPress = () => {
        onEdit();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={is_default ? null : handleOptionsPress}
            activeOpacity={0.8}
            style={style}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
            {/* Header con icono y opciones */}
            <View className="flex-row items-start justify-between mb-3">
                <View 
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: color + '20' }}
                >
                    <Text style={{ fontSize: 24, color: color }}>{icon}</Text>
                </View>
                
                {!is_default && (
                    <TouchableOpacity
                        onPress={handleOptionsPress}
                        className="p-1"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Contenido */}
            <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-lg mb-1" numberOfLines={1}>
                    {name}
                </Text>
                
                {description && (
                    <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>
                        {description}
                    </Text>
                )}

                {/* Contador de favoritos */}
                <View className="flex-row items-center">
                    <Ionicons name="heart" size={14} color={color} />
                    <Text className="text-gray-600 text-sm ml-1">
                        {favorites_count} {favorites_count === 1 ? 'favorito' : 'favoritos'}
                    </Text>
                </View>

                {/* Indicador de categoría por defecto */}
                {is_default && (
                    <View className="mt-2">
                        <View className="bg-blue-100 rounded-md px-2 py-1 self-start">
                            <Text className="text-blue-700 text-xs font-medium">Por defecto</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Indicador visual de que se puede presionar */}
            <View className="absolute bottom-3 right-3">
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );
};

export default CategoryCard;