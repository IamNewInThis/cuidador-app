import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect, useRef } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import { useAuth } from '../contexts/AuthContext';
import { LOCAL, SERVER, DOCKER_LOCAL } from '@env';
import ConversationsService from '../services/ConversationsService';
import FeedbackService from '../services/FeedbackService';
import FeedbackModal from '../components/FeedbackModal';

// Componente para un mensaje del usuario
const UserMessage = ({ text }) => (
    <View className="w-full py-4 px-4 border-b border-gray-100">
        <View className="max-w-4xl mx-auto w-full">
            <View className="flex-row items-center mb-2">
                <Text className="text-sm font-medium text-gray-500">Tú</Text>
            </View>
            <Text className="text-base text-gray-900">{text}</Text>
        </View>
    </View>
);

// Componente para un mensaje del asistente
const AssistantMessage = ({ text, messageId, onFeedback }) => {
    const [showFeedback, setShowFeedback] = useState(false);

    return (
        <>
            <Pressable 
                onLongPress={() => setShowFeedback(true)}
                className="w-full py-4 px-4 bg-gray-50 border-b border-gray-100"
            >
                <View className="max-w-4xl mx-auto w-full">
                    <View className="flex-row items-center mb-2">
                        <Text className="text-sm font-medium text-gray-500">Lumi</Text>
                    </View>
                    <Text className="text-base text-gray-800">{text}</Text>
                </View>
            </Pressable>
            <FeedbackModal
                visible={showFeedback}
                onClose={() => setShowFeedback(false)}
                onSubmit={(rating) => {
                    onFeedback(messageId, rating);
                    setShowFeedback(false);
                }}
            />
        </>
    );
};

const Chat = () => {
    const [message, setMessage] = useState('');
    const { session, user } = useAuth();
    const [messages, setMessages] = useState([]);
    const scrollViewRef = useRef();

    const handleFeedback = async (messageId, rating) => {
        try {
            console.log('Enviando feedback:', { messageId, rating });
            const feedback = await FeedbackService.createFeedback({
                conversationMessageId: messageId,
                rating
            });
            console.log('Feedback enviado exitosamente:', feedback);
        } catch (error) {
            console.error('Error al enviar feedback:', error);
            // Mostrar más detalles del error
            if (error.message) console.error('Mensaje de error:', error.message);
            if (error.stack) console.error('Stack trace:', error.stack);
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
            setMessages(formattedMessages.reverse());
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
            const res = await fetch(`${SERVER}chat`, {
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
