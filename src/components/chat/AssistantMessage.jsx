import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CommentModal from '../CommentModal';
import ChatOptionsModal from './ChatOptionsModal';
import TableView from '../TableView';
import MarkdownText, { splitTextAndTable } from './MarkdownText';

const AssistantMessage = ({ text, messageId, onFeedback, feedback }) => {
    const [showComment, setShowComment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const { before, table, after } = splitTextAndTable(text);

    const handleFeedback = (rating) => {
        if (rating === 'not_useful') {
            setShowComment(true);
            return;
        }

        onFeedback(messageId, rating).then(() => {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        });
    };

    const handleCommentSubmit = (comment) => {
        onFeedback(messageId, 'not_useful', comment).then(() => {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        });
        setShowComment(false);
    };

    const handleCopyMessage = async () => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('Copiado', 'Mensaje copiado al portapapeles');
        } catch (error) {
            console.error('Error al copiar:', error);
            Alert.alert('Error', 'No se pudo copiar el mensaje');
        }
    };

    const handleAddToFavorites = (messageId) => {
        // TODO: Implementar funcionalidad de favoritos
        console.log('Agregando a favoritos:', messageId);
        Alert.alert('Favoritos', 'Mensaje agregado a favoritos (funcionalidad pendiente)');
    };

    return (
        <>
            <View className="w-full py-4 px-4 bg-gray-50 border-b border-gray-100">
                <View className="max-w-4xl mx-auto w-full">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-gray-500">Lumi</Text>
                        {showSuccess && (
                            <Text className="text-sm text-green-600 ml-2">
                                Feedback guardado
                            </Text>
                        )}
                    </View>

                    {table ? (
                        <>
                            {before && <MarkdownText text={before} />}
                            <TableView data={table} />
                            {after && <MarkdownText text={after} />}
                        </>
                    ) : (
                        <MarkdownText text={text} />
                    )}

                    <View className="flex-row items-center justify-between mt-3">
                        {/* Lado izquierdo: Feedback y Copiar */}
                        <View className="flex-row items-center space-x-3">
                            {feedback ? (
                                <View className="p-1 mr-4">
                                    <Entypo
                                        name={feedback.rating === 'useful' ? 'thumbs-up' : 'thumbs-down'}
                                        size={18}
                                        color={feedback.rating === 'useful' ? '#16A34A' : '#DC2626'}
                                    />
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        testID="feedback-useful"
                                        onPress={() => handleFeedback('useful')}
                                        className="p-1 mr-4"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Entypo name="thumbs-up" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        testID="feedback-not-useful"
                                        onPress={() => handleFeedback('not_useful')}
                                        className="p-1 mr-4"
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Entypo name="thumbs-down" size={18} color="#6B7280" />
                                    </TouchableOpacity>
                                </>
                            )}
                            
                            <TouchableOpacity
                                onPress={handleCopyMessage}
                                className="p-1 "
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <FontAwesome name="copy" size={18} color="#6B7280" />
                            </TouchableOpacity> 
                        </View>

                        {/* Lado derecho: Dots */}
                        <TouchableOpacity
                            onPress={() => setShowOptionsModal(true)}
                            className="p-1"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Entypo name="dots-three-vertical" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <CommentModal
                visible={showComment}
                onClose={() => setShowComment(false)}
                onSubmit={handleCommentSubmit}
            />
            <ChatOptionsModal
                visible={showOptionsModal}
                onClose={() => setShowOptionsModal(false)}
                onAddToFavorites={handleAddToFavorites}
                messageId={messageId}
            />
        </>
    );
};

export default AssistantMessage;
