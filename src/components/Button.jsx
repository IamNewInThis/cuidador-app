import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

const Button = ({ title, icon, className, onPress, disabled }) => {
    const isPrimary = className.includes('bg-blue-500');
    return (
        <TouchableOpacity
            className={`w-full h-12 flex-row items-center justify-center rounded-lg bg-blue-500 ${className}`}
            onPress={onPress}
            disabled={disabled}
        >
            {icon && <View className="mr-2">{icon}</View>}
            <Text
                className={`text-base font-semibold ${
                    isPrimary ? 'text-white' : 'text-black'
                }`}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
};

export default Button;