import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FavoriteMessageCard = ({ favorite, onPress, categoryColor, style }) => {
    const { conversation, custom_title, notes, created_at } = favorite;
    const messageContent = conversation?.content || '';
    const isUserMessage = conversation?.role === 'user';
    const babyName = conversation?.baby?.name;

    // Truncar contenido para el preview
    const truncatedContent = messageContent.length > 120 
        ? messageContent.substring(0, 120) + '...' 
        : messageContent;

    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
        return date.toLocaleDateString();
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={style}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                    {custom_title && (
                        <Text className="text-gray-900 font-semibold text-sm mb-1" numberOfLines={1}>
                            {custom_title}
                        </Text>
                    )}
                    <View className="flex-row items-center">
                        <View 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ 
                                backgroundColor: isUserMessage ? '#3B82F6' : '#10B981' 
                            }}
                        />
                        <Text className="text-xs text-gray-500">
                            {isUserMessage ? 'Tu' : 'Lumi'}
                        </Text>
                        {babyName && (
                            <>
                                <Text className="text-xs text-gray-400 mx-1">•</Text>
                                <Text className="text-xs text-gray-500">{babyName}</Text>
                            </>
                        )}
                    </View>
                </View>
                
                <Ionicons name="heart" size={16} color={categoryColor} />
            </View>

            {/* Content Preview */}
            <View className="flex-1 mb-3">
                <Text className="text-gray-700 text-sm leading-5" numberOfLines={4}>
                    {truncatedContent}
                </Text>
            </View>

            {/* Notes Preview */}
            {notes && (
                <View className="mb-3">
                    <View className="bg-gray-50 rounded-lg p-2">
                        <Text className="text-gray-600 text-xs" numberOfLines={2}>
                            📝 {notes}
                        </Text>
                    </View>
                </View>
            )}

            {/* Footer */}
            <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">
                    {formatDate(created_at)}
                </Text>
                
                <View className="flex-row items-center">
                    {messageContent.length > 120 && (
                        <View className="bg-gray-100 rounded-md px-2 py-1">
                            <Text className="text-xs text-gray-600 font-medium">Ver más</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Visual indicator for interaction */}
            <View className="absolute top-3 right-3">
                <Ionicons name="chevron-forward" size={12} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );
};

export default FavoriteMessageCard;