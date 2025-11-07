import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ProfileHeader = ({
    isSelectionMode,
    selectedCount,
    babyName,
    onGoBack,
    onCancelSelection,
    onEdit,
    onExport
}) => {
    return (
        <View className="bg-white border-b border-gray-200">
            <View className="flex-row items-center justify-between px-5 py-4">
                {isSelectionMode ? (
                    <>
                        {/* Modo selección */}
                        <TouchableOpacity
                            onPress={onCancelSelection}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="x" size={20} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-lg font-semibold text-black">
                            {selectedCount} elemento{selectedCount !== 1 ? 's' : ''}
                        </Text>
                        <View className="flex-row items-center space-x-3">
                            <TouchableOpacity
                                onPress={onEdit}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="edit-3" size={18} color="#6B7280" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onExport}
                                className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="download" size={18} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        {/* Modo normal */}
                        <TouchableOpacity
                            onPress={onGoBack}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="menu" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-xl font-semibold text-black">
                            Perfil de {babyName || 'Sin nombre'}
                        </Text>
                        <TouchableOpacity
                            onPress={onExport}
                            className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="check-square" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

export default ProfileHeader;