import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, TextInput } from 'react-native';

const CommentModal = ({ visible, onClose, onSubmit }) => {
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        onSubmit(comment);
        setComment(''); // Limpiar el comentario después de enviarlo
    };

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
                        <Text className="text-lg font-medium text-gray-900">¿Por qué no fue útil?</Text>
                    </View>

                    {/* Contenido */}
                    <View className="p-4">
                        <TextInput
                            className="border border-gray-300 rounded-lg p-3 text-base text-gray-800 min-h-[100px]"
                            placeholder="Describe por qué la respuesta no fue útil..."
                            placeholderTextColor="#6B7280"
                            multiline={true}
                            value={comment}
                            onChangeText={setComment}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Footer */}
                    <View className="p-4 border-t border-gray-200 flex-row justify-end space-x-3">
                        <TouchableOpacity
                            className="py-2 px-4"
                            onPress={onClose}
                        >
                            <Text className="text-gray-600 text-base font-medium">Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-blue-600 py-2 px-4 rounded-lg"
                            onPress={handleSubmit}
                        >
                            <Text className="text-white text-base font-medium">Enviar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Pressable>
        </Modal>
    );
};

export default CommentModal;