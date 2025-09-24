import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useRef } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import { useAuth } from '../contexts/AuthContext';
import { LOCAL, SERVER, DOCKER_LOCAL } from '@env';
import ConversationsService from '../services/ConversationsService';
import FeedbackService from '../services/FeedbackService';
import FeedbackModal from '../components/FeedbackModal';
import CommentModal from '../components/CommentModal';
import TableView from '../components/TableView';

// Componente para un mensaje del usuario
const UserMessage = ({ text }) => (
    <View className="w-full py-4 px-4 border-b border-gray-100">
        <View className="max-w-4xl mx-auto w-full">
            <View className="flex-row items-center mb-2">
                <Text className="text-sm font-medium text-gray-500">Tú</Text>
            </View>
            <Text
                className="text-base text-gray-900"
                selectable={true}
            >
                {text}
            </Text>
        </View>
    </View>
);

// Función para dividir el texto en partes antes, tabla y después
const splitTextAndTable = (text) => {
    const lines = text.split('\n');
    let start = -1, end = -1;
    for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].includes('|') && /^\s*\|?\s*[-: ]+\|[-| :]*$/.test(lines[i + 1])) {
            start = i;
            end = i + 2;
            while (end < lines.length && lines[end].includes('|')) {
                end++;
            }
            break;
        }
    }
    if (start === -1 || end === -1) {
        return { before: text, table: null, after: null };
    }
    const before = lines.slice(0, start).join('\n').trim();
    const table = lines.slice(start, end).join('\n');
    const after = lines.slice(end).join('\n').trim();
    return { before, table, after };
};

// Componente para un mensaje del asistente
const AssistantMessage = ({ text, messageId, onFeedback, feedback }) => {
    const [showComment, setShowComment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const {before, table, after} = splitTextAndTable(text);

    const handleFeedback = (rating) => {
        if (rating === 'not_useful') {
            setShowComment(true);
        } else {
            onFeedback(messageId, rating)
                .then(() => {
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 2000);
                });
        }
    };

    const handleCommentSubmit = (comment) => {
        onFeedback(messageId, 'not_useful', comment)
            .then(() => {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
            });
        setShowComment(false);
    };

    return (
        <>
            <View className="w-full py-4 px-4 bg-gray-50 border-b border-gray-100">
                <View className="max-w-4xl mx-auto w-full">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-gray-500">Lumi</Text>
                        {showSuccess && (
                            <Text className="text-sm text-green-600 ml-2">
                                Feedback guardado
                            </Text>
                        )}
                    </View>

                    {/* Contenido del mensaje */}

                    {/* Texto antes de la tabla */}
                    {before ? (
                        Platform.OS === 'ios' ? (
                            <TextInput
                                value={before}
                                editable={false}
                                multiline={true}
                                scrollEnabled={false}
                                style={{
                                    fontSize: 14,
                                    color: '#1F2937',
                                    backgroundColor: 'transparent',
                                    marginBottom: 8,
                                }}
                            />
                        ) : (
                            <Text selectable={true} style={{ fontSize: 14, color: '#1F2937', marginBottom: 8 }}>
                                {before}
                            </Text>
                        )
                    ) : null}

                    {/* La tabla */}
                    {table && <TableView data={table} />}

                    {/* Texto después de la tabla */}
                    {after ? (
                        Platform.OS === 'ios' ? (
                            <TextInput
                                value={after}
                                editable={false}
                                multiline={true}
                                scrollEnabled={false}
                                style={{
                                    fontSize: 14,
                                    color: '#1F2937',
                                    backgroundColor: 'transparent',
                                    marginTop: 8,
                                }}
                            />
                        ) : (
                            <Text selectable={true} style={{ fontSize: 14, color: '#1F2937', marginTop: 8 }}>
                                {after}
                            </Text>
                        )
                    ) : null}



                    {/* Botones de feedback */}
                    <View className="flex-row items-center justify-end mt-3 space-x-2">
                        {feedback ? (
                            <View className="p-2 rounded-full" style={{
                                backgroundColor: feedback.rating === 'useful' ? '#e6f4ea' : '#fce8e8'
                            }}>
                                <Entypo
                                    name={feedback.rating === 'useful' ? 'thumbs-up' : 'thumbs-down'}
                                    size={20}
                                    color={feedback.rating === 'useful' ? "#16A34A" : "#DC2626"}
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

const Chat = () => {
    const [message, setMessage] = useState('');
    const { session, user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [feedbacks, setFeedbacks] = useState({});
    const scrollViewRef = useRef();

    const handleFeedback = async (messageId, rating, comment = null) => {
        try {
            console.log('Enviando feedback:', { messageId, rating, comment });
            const feedback = await FeedbackService.upsertFeedback({
                conversationMessageId: messageId,
                rating,
                comment
            });
            console.log('Feedback enviado exitosamente:', feedback);

            // Actualizar el estado local de feedbacks
            setFeedbacks(prev => ({
                ...prev,
                [messageId]: { rating, comment }
            }));
        } catch (error) {
            console.error('Error al enviar feedback:', error);
            if (error.message) console.error('Mensaje de error:', error.message);
            if (error.stack) console.error('Stack trace:', error.stack);
        }
    };

    // Cargar los feedbacks existentes
    const loadFeedbacks = async (messageIds) => {
        try {
            const feedbackPromises = messageIds.map(id => FeedbackService.getFeedback(id, user.id));
            const results = await Promise.all(feedbackPromises);

            const feedbackMap = {};
            results.forEach((feedback, index) => {
                if (feedback) {
                    feedbackMap[messageIds[index]] = {
                        rating: feedback.rating,
                        comment: feedback.comment
                    };
                }
            });

            setFeedbacks(feedbackMap);
        } catch (error) {
            console.error('Error loading feedbacks:', error);
        }
    };

    const scrollToBottom = () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    };

    useEffect(() => {
        loadConversationHistory();
    }, []);

    const loadConversationHistory = async () => {
        try {
            const history = await ConversationsService.getConversationHistory();
            const formattedMessages = history.map(msg => ({
                id: msg.id,
                role: msg.role,
                text: msg.content
            }));
            const reversedMessages = formattedMessages.reverse();
            setMessages(reversedMessages);

            // Cargar los feedbacks para todos los mensajes del asistente
            const assistantMessageIds = reversedMessages
                .filter(msg => msg.role === 'assistant')
                .map(msg => msg.id);
            await loadFeedbacks(assistantMessageIds);

            // Hacer scroll al final después de cargar los mensajes
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    };

    const handleOnSendMessage = async () => {
        if (message.trim() === '') {
            return;
        }

        // Verificar que el usuario esté autenticado
        if (!session?.access_token) {
            console.error("No hay sesión activa o token de acceso");
            const errorMsg = { id: Date.now().toString(), role: 'assistant', text: 'Error: Debes iniciar sesión para usar el chat.' };
            setMessages(prevMessages => [...prevMessages, errorMsg]);
            return;
        }

        console.log("Mensaje enviado:", message);

        // Guardar mensaje del usuario
        const savedUserMessage = await ConversationsService.createMessage({
            userId: user.id,
            content: message,
            role: 'user'
        });

        const userMsg = { id: savedUserMessage.id, role: 'user', text: message };
        setMessages(prevMessages => [...prevMessages, userMsg]);

        // POST API
        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            // console.log("Usando API_URL:", API_URL);
            const res = await fetch(`${API_URL}chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    message: message,
                    profile: null,
                }),
            });

            const data = await res.json();
            console.log("Respuesta del API:", data?.answer || data);

            // Guardar respuesta del asistente
            const savedAssistantMessage = await ConversationsService.createMessage({
                userId: user.id,
                content: data?.answer || "Lo siento, no pude obtener una respuesta.",
                role: 'assistant'
            });

            const lumiMsg = { id: savedAssistantMessage.id, role: 'assistant', text: data?.answer || "Lo siento, no pude obtener una respuesta." };
            setMessages(prevMessages => [...prevMessages, lumiMsg]);
            // Hacer scroll al final después de recibir la respuesta
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
            const errorMsg = { id: Date.now().toString(), role: 'assistant', text: 'Error al conectar con el servidor.' };
            setMessages(prevMessages => [...prevMessages, errorMsg]);
        }

        // Limpiamos el input
        setMessage('');
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                {/* Contenedor del chat */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={scrollToBottom}
                    onLayout={scrollToBottom}
                >
                    {messages.map((msg) =>
                        msg.role === "user" ? (
                            <UserMessage key={msg.id} text={msg.text} />
                        ) : (
                            <AssistantMessage
                                key={msg.id}
                                messageId={msg.id}
                                text={msg.text}
                                feedback={feedbacks[msg.id]}
                                onFeedback={handleFeedback}
                            />
                        )
                    )}
                </ScrollView>

                {/* Input de texto y botón de enviar */}
                <View className="border-t border-gray-200 bg-white px-4 py-2">
                    <View className="max-w-4xl mx-auto w-full">
                        <View className="flex-row items-end bg-white rounded-lg border border-gray-300">
                            <TextInput
                                className="flex-1 px-4 py-3 text-base text-gray-800 min-h-[44px] max-h-[120px]"
                                placeholder="Envía un mensaje a Lumi..."
                                placeholderTextColor="#6B7280"
                                value={message}
                                onChangeText={setMessage}
                                multiline={true}
                            />
                            <TouchableOpacity
                                className="px-4 py-2 justify-center"
                                onPress={handleOnSendMessage}
                                disabled={message.trim() === ''}
                            >
                                <Entypo
                                    name="paper-plane"
                                    size={24}
                                    color={message.trim() === '' ? "#9CA3AF" : "#2563EB"}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>

    );
}

export default Chat;
