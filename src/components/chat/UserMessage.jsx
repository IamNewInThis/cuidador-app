import React from 'react';
import { View, Text } from 'react-native';

const UserMessage = ({ text }) => (
    <View className="flex-row justify-end my-2">
        <View className="bg-blue-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
            <Text className="text-white text-base">{text}</Text>
        </View>
    </View>
);

export default UserMessage;
