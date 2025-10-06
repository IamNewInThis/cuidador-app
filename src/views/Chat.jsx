import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import { useAuth } from '../contexts/AuthContext';
import ConversationsService from '../services/ConversationsService';
import FeedbackService from '../services/FeedbackService';
import { getBabies } from '../services/BabiesService';

import AssistantMessage from '../components/chat/AssistantMessage';
import UserMessage from '../components/chat/UserMessage';
import LoadingMessage from '../components/chat/LoadingMessage';
import ChatHeader from '../components/ChatHeader';

const Chat = () => {
    const [message, setMessage] = useState('');
    const { session, user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [feedbacks, setFeedbacks] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [babies, setBabies] = useState([]);
    const [selectedBaby, setSelectedBaby] = useState(null);
    const scrollViewRef = useRef();

    const appendMessage = useCallback((newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    }, []);

    const pushAssistantNotice = useCallback((text) => {
        appendMessage({ id: Date.now().toString(), role: 'assistant', text });
    }, [appendMessage]);

    const handleFeedback = async (messageId, rating, comment = null) => {
        try {
            console.log('Enviando feedback:', { messageId, rating, comment });
            const feedback = await FeedbackService.upsertFeedback({
                conversationMessageId: messageId,
                rating,
                comment,
            });
            console.log('Feedback enviado exitosamente:', feedback);

            setFeedbacks((prev) => ({
                ...prev,
                [messageId]: { rating, comment },
            }));
        } catch (error) {
            console.error('Error al enviar feedback:', error);
            if (error.message) console.error('Mensaje de error:', error.message);
            if (error.stack) console.error('Stack trace:', error.stack);
        }
    };

    const loadFeedbacks = useCallback(async (messageIds) => {
        try {
            const feedbackPromises = messageIds.map((id) => FeedbackService.getFeedback(id, user.id));
            const results = await Promise.all(feedbackPromises);

            const feedbackMap = {};
            results.forEach((feedback, index) => {
                if (feedback) {
                    feedbackMap[messageIds[index]] = {
                        rating: feedback.rating,
                        comment: feedback.comment,
                    };
                }
            });

            setFeedbacks(feedbackMap);
        } catch (error) {
            console.error('Error loading feedbacks:', error);
        }
    }, [user?.id]);

    const scrollToBottom = useCallback(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, []);

    const loadConversationHistory = useCallback(async () => {
        try {
            const history = await ConversationsService.getConversationHistory();
            const formattedMessages = history.map((msg) => ({
                id: msg.id,
                role: msg.role,
                text: msg.content,
            }));
            const reversedMessages = formattedMessages.reverse();
            setMessages(reversedMessages);

            const assistantMessageIds = reversedMessages
                .filter((msg) => msg.role === 'assistant')
                .map((msg) => msg.id);
            await loadFeedbacks(assistantMessageIds);

            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }, [loadFeedbacks, scrollToBottom]);

    const loadBabies = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await getBabies(user.id);
            if (error) {
                console.error('Error loading babies:', error);
                return;
            }
            
            setBabies(data || []);
            // Seleccionar el primer bebé por defecto
            if (data && data.length > 0) {
                setSelectedBaby(data[0]);
            }
        } catch (error) {
            console.error('Error loading babies:', error);
        }
    }, [user?.id]);

    useEffect(() => {
        loadConversationHistory();
        loadBabies();
    }, [loadConversationHistory, loadBabies]);

    const handleOnSendMessage = async () => {
        if (message.trim() === '' || isLoading) {
            return;
        }

        if (!session?.access_token) {
            console.error('No hay sesión activa o token de acceso');
            pushAssistantNotice('Error: Debes iniciar sesión para usar el chat.');
            return;
        }

        console.log('Mensaje enviado:', message);

        const messageToSend = message.trim();
        setMessage('');
        setIsLoading(true);

        try {
            const savedUserMessage = await ConversationsService.createMessage({
                userId: user.id,
                content: messageToSend,
                role: 'user',
            });

            appendMessage({ id: savedUserMessage.id, role: 'user', text: messageToSend });

            const API_URL = 'http://192.168.1.10:5000/api/';
            console.log('Usando API_URL:', API_URL);
            const res = await fetch(`${API_URL}chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    message: messageToSend,
                    profile: null,
                }),
            });

            const data = await res.json();
            console.log('Respuesta del API:', data?.answer || data);

            const assistantContent = data?.answer || 'Lo siento, no pude obtener una respuesta.';
            const savedAssistantMessage = await ConversationsService.createMessage({
                userId: user.id,
                content: assistantContent,
                role: 'assistant',
            });

            appendMessage({ id: savedAssistantMessage.id, role: 'assistant', text: assistantContent });

            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            pushAssistantNotice('Error al conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMenuPress = () => {
        // TODO: Implementar side menu
        console.log('Menu pressed');
    };

    const handleSearchPress = () => {
        // TODO: Implementar búsqueda
        console.log('Search pressed');
    };

    const isSendDisabled = message.trim() === '' || isLoading;

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <ChatHeader 
                babyName={selectedBaby?.name || "Martín"} 
                onMenuPress={handleMenuPress}
                onSearchPress={handleSearchPress}
            />
            
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={scrollToBottom}
                    onLayout={scrollToBottom}
                >
                    {messages.map((msg) =>
                        msg.role === 'user' ? (
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
                    {isLoading && <LoadingMessage />}
                </ScrollView>

                {/* Input mejorado */}
                <View className="border-t border-gray-200 bg-white px-4 py-3">
                    <View className="flex-row items-end bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                        <TextInput
                            className="flex-1 px-4 py-3 text-base text-gray-800 min-h-[48px] max-h-[120px]"
                            placeholder="Pregúntale a Lumi..."
                            placeholderTextColor="#9CA3AF"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            style={{
                                textAlignVertical: 'center',
                            }}
                        />
                        <TouchableOpacity
                            className={`m-2 w-10 h-10 rounded-full items-center justify-center ${
                                isSendDisabled ? 'bg-gray-300' : 'bg-blue-500'
                            }`}
                            onPress={handleOnSendMessage}
                            disabled={isSendDisabled}
                        >
                            <Entypo
                                name="paper-plane"
                                size={20}
                                color="white"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Chat;
