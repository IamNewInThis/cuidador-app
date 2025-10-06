import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Entypo from '@expo/vector-icons/Entypo';

const UserMessage = ({ text }) => {
    const handleCopyMessage = async () => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('Copiado', 'Mensaje copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            Alert.alert('Error', 'No se pudo copiar el mensaje');
        }
    };

    return (
        <View className="flex-row justify-end items-end my-2 space-x-2">
            <TouchableOpacity
                onPress={handleCopyMessage}
                className="p-2 rounded-full bg-gray-100 active:bg-gray-200 mb-1"
            >
                <Entypo name="copy" size={16} color="#6B7280" />
            </TouchableOpacity>
            <View className="bg-blue-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-[75%]">
                <Text className="text-white text-base">{text}</Text>
            </View>
        </View>
    );
};

export default UserMessage;
