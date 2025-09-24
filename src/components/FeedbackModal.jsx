import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import Entypo from '@expo/vector-icons/Entypo';

const FeedbackModal = ({ visible, onClose, onSubmit, currentRating = null }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable
                className="flex-1 justify-center items-center bg-black/50"
                onPress={onClose}
            >
                <View className="bg-white rounded-xl w-[80%] max-w-[400px] overflow-hidden">
                    {/* Header */}
                    <View className="p-4 border-b border-gray-200">
                        <Text className="text-lg font-medium text-gray-900">¿Fue útil esta respuesta?</Text>
                    </View>

                    {/* Opciones */}
                    <View className="p-4 space-y-3">
                        <TouchableOpacity
                            className={`flex-row items-center p-3 rounded-lg border ${currentRating === 'useful'
                                    ? 'bg-green-50 border-green-500'
                                    : 'border-gray-200 active:bg-gray-50'
                                }`}
                            onPress={() => onSubmit('useful')}
                        >
                            <Entypo
                                name="thumbs-up"
                                size={24}
                                color={currentRating === 'useful' ? "#16A34A" : "#16A34A"}
                            />
                            <Text className={`ml-3 text-base ${currentRating === 'useful' ? 'text-green-700' : 'text-gray-900'
                                }`}>
                                Buena respuesta
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-row items-center p-3 rounded-lg border ${currentRating === 'not_useful'
                                    ? 'bg-red-50 border-red-500'
                                    : 'border-gray-200 active:bg-gray-50'
                                }`}
                            onPress={() => onSubmit('not_useful')}
                        >
                            <Entypo
                                name="thumbs-down"
                                size={24}
                                color={currentRating === 'not_useful' ? "#DC2626" : "#DC2626"}
                            />
                            <Text className={`ml-3 text-base ${currentRating === 'not_useful' ? 'text-red-700' : 'text-gray-900'
                                }`}>
                                Mala respuesta
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="p-4 border-t border-gray-200">
                        <TouchableOpacity
                            className="py-2 items-center"
                            onPress={onClose}
                        >
                            <Text className="text-blue-600 text-base font-medium">Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};

export default FeedbackModal;