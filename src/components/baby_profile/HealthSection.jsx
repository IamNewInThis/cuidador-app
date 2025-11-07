import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const HealthSection = ({ navigation }) => {
    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('HealthProfileView')}
            activeOpacity={0.7}
            className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100"
        >
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3">
                        <Feather name="heart" size={16} color="#EF4444" />
                    </View>
                    <Text className="text-xl font-bold text-gray-800">Salud y bienestar</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </View>
            
            <View className="space-y-3">
                {/* Alergias */}
                <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                    <View className="flex-1">
                        <Text className="text-gray-700 font-medium">Alergias:</Text>
                        <View className="flex-row flex-wrap mt-1">
                            <View className="bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mr-1 mb-1">
                                <Text className="text-red-700 text-xs">Huevo</Text>
                            </View>
                            <View className="bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mr-1 mb-1">
                                <Text className="text-red-700 text-xs">Polen</Text>
                            </View>
                            <View className="bg-gray-100 rounded-full px-2 py-0.5">
                                <Text className="text-gray-600 text-xs">+2 más</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Condiciones médicas */}
                <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                    <View className="flex-1">
                        <Text className="text-gray-700 font-medium">Condiciones médicas:</Text>
                        <View className="flex-row flex-wrap mt-1">
                            <View className="bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 mr-1 mb-1">
                                <Text className="text-orange-700 text-xs">Asma leve</Text>
                            </View>
                            <View className="bg-gray-100 rounded-full px-2 py-0.5">
                                <Text className="text-gray-600 text-xs">+1 más</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Estado general */}
                <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                    <View className="flex-1">
                        <Text className="text-gray-600 mt-1">Última revisión: 15 Oct 2025</Text>
                    </View>
                </View>

                {/* Indicador de navegación */}
                <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-blue-600 text-sm font-medium">Toca para ver detalles completos</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default HealthSection;