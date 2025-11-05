import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CommentModal from '../CommentModal';
import ChatOptionsModal from './ChatOptionsModal';
import TableView from '../TableView';
import MarkdownText, { splitTextAndTable } from './MarkdownText';
import FavoritesService from '../../services/FavoritesService';
import SelectCategoryModal from '../favorites/SelectCategoryModal';

const AssistantMessage = ({ 
    text, 
    messageId, 
    onFeedback, 
    feedback, 
    isHighlighted, 
    highlightText,
    profileKeywords,
    keywordsSaved,
    onConfirmKeywords
}) => {
    const [showComment, setShowComment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isAddingFavorite, setIsAddingFavorite] = useState(false);
    const [selectedBaby, setSelectedBaby] = useState(null);
    const { before, table, after } = splitTextAndTable(text);

    useEffect(() => {
        loadSelectedBaby();
    }, []);

    const loadSelectedBaby = async () => {
        try {
            const babyData = await AsyncStorage.getItem('selectedBaby');
            if (babyData) {
                setSelectedBaby(JSON.parse(babyData));
            }
        } catch (error) {
            console.error('Error loading selected baby:', error);
        }
    };

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

    const handleAddToFavorites = async () => {
        // Mostrar el modal de selección de categoría
        setShowCategoryModal(true);
    };

    const handleCategorySelected = async (categoryId) => {
        if (isAddingFavorite) {
            return;
        }

        try {
            setIsAddingFavorite(true);
            await FavoritesService.addToFavorites({
                conversationMessageId: messageId,
                categoryId: categoryId,
                babyId: selectedBaby?.id // ✅ Incluir baby_id
            });
            Alert.alert('¡Guardado!', 'Mensaje agregado a favoritos exitosamente', [
                { text: 'Ver favoritos', onPress: () => {/* Navegar a favoritos */ } },
                { text: 'OK', style: 'default' }
            ]);
        } catch (error) {
            console.error('Error al agregar a favoritos:', error);
            Alert.alert('Error', 'No se pudo agregar a favoritos. Intenta nuevamente.');
        } finally {
            setIsAddingFavorite(false);
        }
    };

    const renderHighlightedText = (text, highlight) => {
        if (!highlight || highlight.trim() === '') {
            return <MarkdownText text={text} />;
        }

        // Normaliza acentos
        const normalize = (str) =>
            str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const normalizedText = normalize(text);
        const normalizedHighlight = normalize(highlight);
        const regex = new RegExp(`(${normalizedHighlight})`, 'gi');

        const parts = normalizedText.split(regex);
        let originalIndex = 0;

        return (
            <Text>
                {parts.map((part, index) => {
                    const originalPart = text.slice(originalIndex, originalIndex + part.length);
                    originalIndex += part.length;

                    const isMatch = normalize(part).toLowerCase() === normalizedHighlight.toLowerCase();

                    if (isMatch) {
                        // ✅ Resalta solo la palabra, manteniendo el resto del estilo del contenedor
                        return (
                            <Text
                                key={index}
                                style={{
                                    backgroundColor: 'rgba(255, 235, 59, 0.5)', // amarillo con opacidad
                                    borderRadius: 4,
                                }}
                            >
                                {originalPart}
                            </Text>
                        );
                    }

                    return <Text key={index}>{originalPart}</Text>;
                })}
            </Text>
        );
    };


    return (
        <>
            <View
                className={`
                    w-full py-4 px-4 border-b border-gray-100
                `}
            >
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
                            {before && renderHighlightedText(before, highlightText)}
                            <TableView data={table} />
                            {after && renderHighlightedText(after, highlightText)}
                        </>
                    ) : (
                        renderHighlightedText(text, highlightText)
                    )}

                    {/* 💬 Pregunta cuando se detectan keywords */}
                    {profileKeywords && !keywordsSaved && (
                        <View className="mt-3 mb-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <Text className="text-blue-800 text-sm">
                                Hemos detectado {profileKeywords.keywords?.length || 0} característica{(profileKeywords.keywords?.length || 0) !== 1 ? 's' : ''} para el perfil de tu bebé. ¿Deseas guardarla{(profileKeywords.keywords?.length || 0) !== 1 ? 's' : ''}?
                            </Text>
                        </View>
                    )}

                    {/* ✅ Mensaje de confirmación cuando ya se guardaron */}
                    {keywordsSaved && (
                        <View className="mt-3 mb-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex-row items-center">
                            <AntDesign name="checkcircle" size={16} color="#16A34A" />
                            <Text className="text-green-700 ml-2 text-sm">
                                Características guardadas en el perfil
                            </Text>
                        </View>
                    )}

                    <View className="flex-row items-center justify-between mt-3">
                        {/* Lado izquierdo: Feedback, Copiar y Guardar Keywords */}
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
                                className="p-1 mr-4"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <FontAwesome name="copy" size={18} color="#6B7280" />
                            </TouchableOpacity>

                            {/* 💾 Ícono para guardar keywords */}
                            {profileKeywords && !keywordsSaved && (
                                <TouchableOpacity
                                    testID="save-keywords-button"
                                    onPress={() => onConfirmKeywords(messageId, profileKeywords)}
                                    className="p-1 mr-4"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <AntDesign name="save" size={18} color="#3B82F6" />
                                </TouchableOpacity>
                            )}

                            {/* ✅ Ícono cuando ya se guardaron */}
                            {keywordsSaved && (
                                <View className="p-1 mr-4">
                                    <AntDesign name="checkcircle" size={18} color="#16A34A" />
                                </View>
                            )}
                        </View>

                        {/* Lado derecho: Dots */}
                        <TouchableOpacity
                            testID="assistant-options-button"
                            onPress={() => setShowOptionsModal(true)}
                            className="p-1"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Entypo name="dots-three-vertical" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Modales */}
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
            <SelectCategoryModal
                visible={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSelectCategory={handleCategorySelected}
                messageId={messageId}
                babyId={selectedBaby?.id}
            />
        </>
    );
};

export default AssistantMessage;
