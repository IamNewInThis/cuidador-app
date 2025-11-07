import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ProfileSection = ({
    title,
    color = 'blue',
    icon,
    children,
    isSelected,
    isSelectionMode,
    onPress,
    noDataMessage
}) => {
    const getColorClasses = () => {
        const colors = {
            blue: {
                border: 'border-blue-500',
                bg: 'bg-blue-50',
                itemBg: 'bg-blue-100',
                dot: 'bg-blue-500',
                checkbox: 'bg-blue-500 border-blue-500'
            },
            purple: {
                border: 'border-purple-500',
                bg: 'bg-purple-50',
                itemBg: 'bg-purple-100',
                dot: 'bg-purple-500',
                checkbox: 'bg-purple-500 border-purple-500'
            },
            green: {
                border: 'border-green-500',
                bg: 'bg-green-50',
                itemBg: 'bg-green-100',
                dot: 'bg-green-500',
                checkbox: 'bg-green-500 border-green-500'
            },
            orange: {
                border: 'border-orange-500',
                bg: 'bg-orange-50',
                itemBg: 'bg-orange-100',
                dot: 'bg-orange-500',
                checkbox: 'bg-orange-500 border-orange-500'
            },
            red: {
                border: 'border-red-500',
                bg: 'bg-red-50',
                itemBg: 'bg-red-100',
                dot: 'bg-red-500',
                checkbox: 'bg-red-500 border-red-500'
            }
        };

        return colors[color] || colors.blue;
    };

    const colorClasses = getColorClasses();

    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                isSelected ? `${colorClasses.border} ${colorClasses.bg}` : 'border-gray-100'
            }`}>
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        {isSelectionMode && (
                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                isSelected 
                                    ? colorClasses.checkbox
                                    : 'border-gray-300'
                            }`}>
                                {isSelected && (
                                    <Feather name="check" size={14} color="white" />
                                )}
                            </View>
                        )}
                        {icon && (
                            <View className={`w-8 h-8 rounded-full ${colorClasses.bg} items-center justify-center mr-3`}>
                                {icon}
                            </View>
                        )}
                        <Text className="text-xl font-bold text-gray-800">{title}</Text>
                    </View>
                </View>
                
                <View className="space-y-3">
                    {children ? children : (
                        <View className="flex-row items-center p-4 bg-gray-50 rounded-lg">
                            <Feather name="info" size={16} color="#6B7280" />
                            <Text className="text-gray-500 text-sm flex-1 ml-2">
                                {noDataMessage}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ProfileSection;