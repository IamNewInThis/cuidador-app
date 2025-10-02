import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

const LoadingMessage = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => {
                if (prev === '...') return '';
                return prev + '.';
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <View className="w-full py-4 px-4 bg-gray-50 border-b border-gray-100">
            <View className="max-w-4xl mx-auto w-full">
                <View className="flex-row items-center mb-2">
                    <Text className="text-sm font-medium text-gray-500">Lumi</Text>
                </View>
                <View className="flex-row items-center">
                    <Text className="text-base text-gray-600">Escribiendo{dots}</Text>
                </View>
            </View>
        </View>
    );
};

export default LoadingMessage;
