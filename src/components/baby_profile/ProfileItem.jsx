import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ProfileItem = ({
    id,
    label,
    value,
    color = 'blue',
    isSelected,
    isSelectionMode,
    onPress
}) => {
    const getColorClasses = () => {
        const colors = {
            blue: {
                bg: 'bg-blue-100',
                dot: 'bg-blue-500',
                checkbox: 'bg-blue-500 border-blue-500'
            },
            purple: {
                bg: 'bg-purple-100',
                dot: 'bg-purple-500',
                checkbox: 'bg-purple-500 border-purple-500'
            },
            green: {
                bg: 'bg-green-100',
                dot: 'bg-green-500',
                checkbox: 'bg-green-500 border-green-500'
            },
            orange: {
                bg: 'bg-orange-100',
                dot: 'bg-orange-500',
                checkbox: 'bg-orange-500 border-orange-500'
            },
            red: {
                bg: 'bg-red-100',
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
            <View className={`flex-row items-start p-2 rounded-lg ${
                isSelected ? colorClasses.bg : ''
            }`}>
                {isSelectionMode && (
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                        isSelected 
                            ? colorClasses.checkbox
                            : 'border-gray-300'
                    }`}>
                        {isSelected && (
                            <Feather name="check" size={12} color="white" />
                        )}
                    </View>
                )}
                <View className={`w-2 h-2 rounded-full ${colorClasses.dot} mt-2 mr-3`} />
                <View className="flex-1">
                    <Text className="text-gray-700 font-medium">{label}:</Text>
                    <Text className="text-gray-600 mt-1">
                        {value}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default ProfileItem;