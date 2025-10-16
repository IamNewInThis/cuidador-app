import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConfigurationOption = ({
    icon,
    title,
    subtitle,
    onPress,
    showDivider = true,
    rightElement
}) => {
    return (
        <>
            <TouchableOpacity
                className="flex-row items-center py-4 px-4 min-h-14"
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 rounded-lg items-center justify-center mr-3">
                        <Ionicons name={icon} size={20} color="#666666" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-base font-medium text-black mb-0.5">{title}</Text>
                        {subtitle && <Text className="text-sm text-gray-600">{subtitle}</Text>}
                    </View>
                </View>

                <View className="items-center justify-center">
                    {rightElement || (
                        <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
                    )}
                </View>
            </TouchableOpacity>

            {showDivider && <View className="h-px bg-gray-200 ml-15" />}
        </>
    );
};

export default ConfigurationOption;