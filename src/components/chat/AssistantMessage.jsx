import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Entypo from '@expo/vector-icons/Entypo';
import CommentModal from '../CommentModal';
import TableView from '../TableView';
import MarkdownText, { splitTextAndTable } from './MarkdownText';

const AssistantMessage = ({ text, messageId, onFeedback, feedback }) => {
    const [showComment, setShowComment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
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

                    <View className="flex-row items-center justify-end mt-3 space-x-2">
                        <TouchableOpacity
                            onPress={handleCopyMessage}
                            className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
                        >
                            <Entypo name="copy" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        
                        {feedback ? (
                            <View
                                className="p-2 rounded-full"
                                style={{
                                    backgroundColor: feedback.rating === 'useful' ? '#e6f4ea' : '#fce8e8',
                                }}
                            >
                                <Entypo
                                    name={feedback.rating === 'useful' ? 'thumbs-up' : 'thumbs-down'}
                                    size={20}
                                    color={feedback.rating === 'useful' ? '#16A34A' : '#DC2626'}
                                />
                            </View>
                        ) : (
                            <>
                                <TouchableOpacity
                                    onPress={() => handleFeedback('useful')}
                                    className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
                                >
                                    <Entypo name="thumbs-up" size={20} color="#16A34A" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleFeedback('not_useful')}
                                    className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
                                >
                                    <Entypo name="thumbs-down" size={20} color="#DC2626" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
            <CommentModal
                visible={showComment}
                onClose={() => setShowComment(false)}
                onSubmit={handleCommentSubmit}
            />
        </>
    );
};

export default AssistantMessage;
