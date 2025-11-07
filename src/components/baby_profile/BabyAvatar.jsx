import React from 'react';
import { View, Text } from 'react-native';

const BabyAvatar = ({ name, age }) => {
    return (
        <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
                <Text className="text-3xl">👶</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-1">{name || 'Sin nombre'}</Text>
            <Text className="text-lg text-gray-600">{age || ''}</Text>
        </View>
    );
};

export default BabyAvatar;