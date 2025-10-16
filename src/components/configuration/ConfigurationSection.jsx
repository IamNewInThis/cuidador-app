import React from 'react';
import { View, Text } from 'react-native';

const ConfigurationSection = ({ title, subtitle, children }) => {
    return (
        <View className="mb-8 px-5">
            <View className="mb-3">
                <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    {title}
                </Text>
                {subtitle && <Text className="text-sm text-gray-400">{subtitle}</Text>}
            </View>
            <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                {children}
            </View>
        </View>
    );
};

export default ConfigurationSection;