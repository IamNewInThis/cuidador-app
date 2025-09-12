import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import { useAuth } from '../contexts/AuthContext';
import { LOCAL } from '@env';
import ConversationsService from '../services/ConversationsService';

// Componente para un mensaje del usuario
const UserMessage = ({ text }) => (
    <View className="flex-row justify-end my-2">
        <View className="bg-blue-600 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
            <Text className="text-white text-base">{text}</Text>
        </View>
    </View>
);

// Componente para un mensaje del asistente
const AssistantMessage = ({ text }) => (
    <View className="flex-row justify-start my-2">
        <View className="bg-gray-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
            <Text className="text-gray-800 text-base">{text}</Text>
        </View>
    </View>
);

const Chat = () => {
    const [message, setMessage] = useState('');
    const { session, user } = useAuth();
    const [messages, setMessages] = useState([]);

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
            const res = await fetch(`${LOCAL}chat`, {
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
                    className="flex-1 px-4 pt-4"
                    keyboardShouldPersistTaps="handled"
                >
                    {messages.map((msg) =>
                        msg.role === "user" ? (
                            <UserMessage key={msg.id} text={msg.text} />
                        ) : (
                            <AssistantMessage key={msg.id} text={msg.text} />
                        )
                    )}
                </ScrollView>

                {/* Input de texto y botón de enviar */}
                <View className="flex-row items-center border-t border-gray-300 px-4 py-2 bg-gray-50">
                    <TextInput
                        className="flex-1 rounded-full bg-gray-200 px-4 py-3 text-base text-gray-800"
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor="#6B7280"
                        value={message}
                        onChangeText={setMessage}
                        multiline={true}
                    />
                    <TouchableOpacity
                        className="bg-blue-600 rounded-full p-3 ml-2 active:bg-blue-700"
                        onPress={handleOnSendMessage}
                    >
                        <Entypo name="chevron-right" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>

    );
}

export default Chat;
