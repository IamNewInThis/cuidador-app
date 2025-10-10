import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

const FavoriteDetailModal = ({ visible, favorite, onClose, onRemove, categoryColor }) => {
    const [showActions, setShowActions] = useState(false);

    if (!favorite) return null;

    const { conversation, custom_title, notes, created_at, category } = favorite;
    const messageContent = conversation?.content || '';
    const isUserMessage = conversation?.role === 'user';
    const babyName = conversation?.baby?.name;

    const formatFullDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCopy = async () => {
        try {
            await Clipboard.setStringAsync(messageContent);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('¡Copiado!', 'El mensaje se ha copiado al portapapeles');
        } catch (error) {
            console.error('Error copying:', error);
            Alert.alert('Error', 'No se pudo copiar el mensaje');
        }
    };

    const handleShare = async () => {
        try {
            const shareContent = custom_title 
                ? `${custom_title}\n\n${messageContent}`
                : messageContent;
                
            await Share.share({
                message: shareContent,
                title: custom_title || 'Mensaje favorito de Lumi'
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleRemoveConfirm = () => {
        Alert.alert(
            'Eliminar favorito',
            '¿Estás seguro de que quieres eliminar este mensaje de tus favoritos?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: () => onRemove && onRemove(favorite.id)
                }
            ]
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
                <View className="bg-white px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                        
                        <View className="flex-row items-center">
                            <View 
                                className="w-6 h-6 rounded-lg items-center justify-center mr-2"
                                style={{ backgroundColor: categoryColor + '20' }}
                            >
                                <Text style={{ fontSize: 12, color: categoryColor }}>
                                    {category?.icon || '⭐'}
                                </Text>
                            </View>
                            <Text className="text-lg font-semibold text-gray-900">
                                {category?.name || 'Favorito'}
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => setShowActions(!showActions)}
                            className="p-1"
                        >
                            <Ionicons name="ellipsis-horizontal" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Actions Menu */}
                    {showActions && (
                        <View className="absolute top-16 right-6 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <TouchableOpacity
                                onPress={() => {
                                    setShowActions(false);
                                    handleCopy();
                                }}
                                className="flex-row items-center px-4 py-3 border-b border-gray-100"
                            >
                                <Ionicons name="copy-outline" size={18} color="#374151" />
                                <Text className="text-gray-700 ml-3">Copiar mensaje</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    setShowActions(false);
                                    handleShare();
                                }}
                                className="flex-row items-center px-4 py-3 border-b border-gray-100"
                            >
                                <Ionicons name="share-outline" size={18} color="#374151" />
                                <Text className="text-gray-700 ml-3">Compartir</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                onPress={() => {
                                    setShowActions(false);
                                    handleRemoveConfirm();
                                }}
                                className="flex-row items-center px-4 py-3"
                            >
                                <Ionicons name="heart-dislike-outline" size={18} color="#EF4444" />
                                <Text className="text-red-500 ml-3">Quitar de favoritos</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <ScrollView className="flex-1 px-6 py-6">
                    {/* Message Info */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-3">
                            <View 
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ 
                                    backgroundColor: isUserMessage ? '#3B82F6' : '#10B981' 
                                }}
                            />
                            <Text className="text-gray-600 font-medium">
                                {isUserMessage ? 'Tu mensaje' : 'Respuesta de Lumi'}
                            </Text>
                            {babyName && (
                                <>
                                    <Text className="text-gray-400 mx-2">•</Text>
                                    <Text className="text-gray-600">{babyName}</Text>
                                </>
                            )}
                        </View>
                        
                        <Text className="text-gray-500 text-sm">
                            {formatFullDate(created_at)}
                        </Text>
                    </View>

                    {/* Custom Title */}
                    {custom_title && (
                        <View className="mb-6">
                            <Text className="text-gray-600 font-medium mb-2">Título personalizado</Text>
                            <View className="bg-gray-50 rounded-lg p-4">
                                <Text className="text-gray-900 text-lg font-semibold">
                                    {custom_title}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Message Content */}
                    <View className="mb-6">
                        <Text className="text-gray-600 font-medium mb-3">Mensaje</Text>
                        <View className={`rounded-lg p-4 ${
                            isUserMessage ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'
                        }`}>
                            <Text className="text-gray-900 text-base leading-6">
                                {messageContent}
                            </Text>
                        </View>
                    </View>

                    {/* Notes */}
                    {notes && (
                        <View className="mb-6">
                            <Text className="text-gray-600 font-medium mb-3">Notas personales</Text>
                            <View className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                                <Text className="text-gray-900 text-base leading-6">
                                    {notes}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Category Info */}
                    <View className="mb-6">
                        <Text className="text-gray-600 font-medium mb-3">Categoría</Text>
                        <View className="flex-row items-center">
                            <View 
                                className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                                style={{ backgroundColor: categoryColor + '20' }}
                            >
                                <Text style={{ fontSize: 20, color: categoryColor }}>
                                    {category?.icon || '⭐'}
                                </Text>
                            </View>
                            <View>
                                <Text className="text-gray-900 font-medium">
                                    {category?.name || 'Sin categoría'}
                                </Text>
                                {category?.description && (
                                    <Text className="text-gray-500 text-sm">
                                        {category.description}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Overlay para cerrar actions menu */}
            {showActions && (
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'transparent'
                    }}
                    onPress={() => setShowActions(false)}
                    activeOpacity={1}
                />
            )}
        </Modal>
    );
};

export default FavoriteDetailModal;