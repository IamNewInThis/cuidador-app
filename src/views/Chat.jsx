import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ConversationsService from '../services/ConversationsService';
import FeedbackService from '../services/FeedbackService';
import { getBabies } from '../services/BabiesService';
import AntDesign from '@expo/vector-icons/AntDesign';


import AssistantMessage from '../components/chat/AssistantMessage';
import UserMessage from '../components/chat/UserMessage';
import LoadingMessage from '../components/chat/LoadingMessage';
import ChatHeader from '../components/chat/ChatHeader';
import BabySelectionModal from '../components/chat/BabySelectionModal';
import SideMenu from '../components/SideMenu';

const formatBabyAge = (birthdate) => {
    if (!birthdate) return '';

    const parsedDate = new Date(birthdate);
    if (Number.isNaN(parsedDate.getTime())) {
        return '';
    }

    const now = new Date();
    let years = now.getFullYear() - parsedDate.getFullYear();
    let months = now.getMonth() - parsedDate.getMonth();

    if (now.getDate() < parsedDate.getDate()) {
        months -= 1;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    years = Math.max(years, 0);
    months = Math.max(months, 0);

    const parts = [];
    if (years > 0) {
        parts.push(`${years} año${years !== 1 ? 's' : ''}`);
    }
    if (months > 0) {
        parts.push(`${months} mes${months !== 1 ? 'es' : ''}`);
    }

    if (parts.length === 0) {
        return 'recién nacido';
    }

    return parts.join(' ');
};

const Chat = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [message, setMessage] = useState('');
    const { session, user, signOut } = useAuth();
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [feedbacks, setFeedbacks] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [babies, setBabies] = useState([]);
    const [selectedBaby, setSelectedBaby] = useState(null);
    const [showBabyModal, setShowBabyModal] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const scrollViewRef = useRef();
    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [highlightedMessageIds, setHighlightedMessageIds] = useState([]);
    const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
    const [messagePositions, setMessagePositions] = useState({});


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

    const scrollToMessage = (messageId) => {
        const y = messagePositions[messageId];
        if (typeof y === 'number' && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
        }
    };

    const loadConversationHistory = useCallback(async (babyId = null) => {
        setIsLoadingConversations(true);
        try {
            let history;
            if (babyId) {
                // Cargar conversaciones específicas del bebé
                history = await ConversationsService.getConversationsByBaby(babyId);
                // console.log(`Cargando conversaciones para bebé ID: ${babyId}`);
            } else {
                // Cargar todas las conversaciones (comportamiento anterior)
                history = await ConversationsService.getConversationHistory();
                // console.log('Cargando todas las conversaciones');
            }

            const formattedMessages = history.map((msg) => ({
                id: msg.id,
                role: msg.role,
                text: msg.content,
                babyId: msg.baby_id,
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
        } finally {
            setIsLoadingConversations(false);
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

            if (!data || data.length === 0) {
                console.log('No hay bebés disponibles');
                setSelectedBaby(null);
                return;
            }

            // Intentar recuperar la selección guardada
            try {
                const savedBabyId = await AsyncStorage.getItem(`selectedBaby_${user.id}`);
                if (savedBabyId) {
                    // Buscar el bebé guardado en la lista actual
                    const savedBaby = data.find(baby => baby.id === savedBabyId);
                    if (savedBaby) {
                        // console.log('Restaurando bebé seleccionado:', savedBaby.name);
                        setSelectedBaby(savedBaby);
                        return; // Salir aquí porque ya encontramos y establecimos el bebé
                    } else {
                        // El bebé guardado ya no existe, limpiar storage
                        console.log('Bebé guardado ya no existe, limpiando selección');
                        await AsyncStorage.removeItem(`selectedBaby_${user.id}`);
                    }
                }
            } catch (storageError) {
                console.log('Error recuperando selección de bebé:', storageError);
            }

            // Si llegamos aquí, no había selección guardada válida, seleccionar el primer bebé
            console.log('Seleccionando primer bebé por defecto:', data[0].name);
            setSelectedBaby(data[0]);
            // Guardar esta selección por defecto
            try {
                await AsyncStorage.setItem(`selectedBaby_${user.id}`, data[0].id);
            } catch (storageError) {
                console.log('Error guardando selección por defecto:', storageError);
            }

        } catch (error) {
            console.error('Error loading babies:', error);
        }
    }, [user?.id]);

    // Efecto para cargar conversaciones cuando cambia el bebé seleccionado
    useEffect(() => {
        if (selectedBaby) {
            // console.log('Bebé seleccionado cambió:', selectedBaby.name);
            loadConversationHistory(selectedBaby.id);
        }
    }, [selectedBaby, loadConversationHistory]);

    useEffect(() => {
        loadBabies();
        // Cargar conversaciones generales solo al inicio si no hay bebé seleccionado
        if (!selectedBaby) {
            loadConversationHistory();
        }
    }, [loadBabies]);


    // Recargar datos cuando el componente se enfoque (útil cuando se regresa de otras pantallas)
    useFocusEffect(
        useCallback(() => {
            // Recargar bebés y restaurar selección cada vez que se enfoque el chat
            loadBabies();
            
            // Si viene con el parámetro openSideMenu, abrir el SideMenu
            if (route.params?.openSideMenu) {
                setIsMenuVisible(true);
                // Limpiar el parámetro para que no se abra automáticamente la próxima vez
                navigation.setParams({ openSideMenu: undefined });
            }
        }, [loadBabies, route.params?.openSideMenu])
    );

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
                babyId: selectedBaby?.id || null,
                content: messageToSend,
                role: 'user',
            });

            appendMessage({
                id: savedUserMessage.id,
                role: 'user',
                text: messageToSend,
                babyId: selectedBaby?.id || null
            });

            const API_URL = process.env.EXPO_PUBLIC_API_URL;
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
                    baby_id: selectedBaby?.id || null,
                }),
            });

            const data = await res.json();
            console.log('Respuesta del API:', data?.answer || data);

            const assistantContent = data?.answer || 'Lo siento, no pude obtener una respuesta.';
            const savedAssistantMessage = await ConversationsService.createMessage({
                userId: user.id,
                babyId: selectedBaby?.id || null,
                content: assistantContent,
                role: 'assistant',
            });

            appendMessage({
                id: savedAssistantMessage.id,
                role: 'assistant',
                text: assistantContent,
                babyId: selectedBaby?.id || null
            });

            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            pushAssistantNotice('Error al conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMenuPress = () => {
        setIsMenuVisible(true);
    };

    const handleCloseMenu = () => {
        setIsMenuVisible(false);
    };

    const handleSearchPress = () => {
        setShowSearch(!showSearch);
        console.log('Search pressed');
    };

    const handleSubmitSearch = async () => {
        console.log('Buscando mensaje:', searchText);
        try {
            const results = await ConversationsService.searchMessagesByText(selectedBaby.id, searchText);

            if (results && results.length > 0) {
                // Guardamos todos los IDs encontrados
                setHighlightedMessageIds(results.map(r => r.id));
            } else {
                setHighlightedMessageIds([]);
                Alert.alert('Sin resultados', 'No se encontraron mensajes con ese texto.');
            }
        } catch (error) {
            console.error('Error al buscar mensaje:', error);
        }
    };

    const handleSearchClose = () => {
        setShowSearch(false);
        setSearchText('');
        setHighlightedMessageIds([]);
    };

    const handleNextResult = () => {
        if (highlightedMessageIds.length === 0) return;
        const nextIndex =
            currentHighlightIndex + 1 < highlightedMessageIds.length ? currentHighlightIndex + 1 : 0;
        setCurrentHighlightIndex(nextIndex);
        scrollToMessage(highlightedMessageIds[nextIndex]);
    };

    const handlePrevResult = () => {
        if (highlightedMessageIds.length === 0) return;
        const prevIndex =
            currentHighlightIndex - 1 >= 0 ? currentHighlightIndex - 1 : highlightedMessageIds.length - 1;
        setCurrentHighlightIndex(prevIndex);
        scrollToMessage(highlightedMessageIds[prevIndex]);
    };



    const handleBabyPress = () => {
        setShowBabyModal(true);
    };

    const handleBabyPressFromMenu = () => {
        setIsMenuVisible(false);
        setTimeout(() => {
            setShowBabyModal(true);
        }, 220);
    };

    const handleNavigateToFavorites = async () => {
        try {
            // Asegurar que el bebé seleccionado esté guardado en AsyncStorage
            if (selectedBaby && user) {
                // Guardar con ambas keys para compatibilidad
                await AsyncStorage.setItem(`selectedBaby_${user.id}`, selectedBaby.id);
                await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBaby));
                // console.log('Baby saved to AsyncStorage before navigating to Favorites:', selectedBaby);
            }
            navigation.navigate('Favorites');
        } catch (error) {
            console.error('Error saving baby before navigation:', error);
            navigation.navigate('Favorites');
        }
    };

    const handleNavigateToBabyProfile = () => {
        if (selectedBaby) {
            navigation.navigate('BabyProfile', { babyId: selectedBaby.id });
        } else {
            // Si no hay bebé seleccionado, ir a la lista de bebés
            navigation.navigate('Babies');
        }
    };

    const handleNavigateToUserProfile = () => {
        navigation.navigate('ProfileSettings');
    };

    const handleNavigateToSubscription = () => {
        navigation.navigate('SubscriptionView');
    };

    const handleNavigateToCreateBaby = () => {
        navigation.navigate('Babies');
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const handleSelectBaby = async (baby) => {
        // console.log('Baby selected:', baby.name);
        setSelectedBaby(baby);
        setShowBabyModal(false);

        // Guardar la selección en AsyncStorage
        try {
            await AsyncStorage.setItem(`selectedBaby_${user.id}`, baby.id);
            console.log('Selección de bebé guardada:', baby.name);
        } catch (storageError) {
            console.log('Error guardando selección de bebé:', storageError);
        }

        // Las conversaciones se cargarán automáticamente gracias al useEffect que detecta cambios en selectedBaby
    };

    const clearSelectedBaby = async () => {
        try {
            await AsyncStorage.removeItem(`selectedBaby_${user.id}`);
            console.log('Selección de bebé limpiada');
        } catch (storageError) {
            console.log('Error limpiando selección de bebé:', storageError);
        }
    };

    const handleCloseBabyModal = () => {
        setShowBabyModal(false);
    };

    const isSendDisabled = message.trim() === '' || isLoading;
    const selectedBabyAge = selectedBaby?.birthdate ? formatBabyAge(selectedBaby.birthdate) : '';

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <ChatHeader
                babyName={selectedBaby?.name || ""}
                onMenuPress={handleMenuPress}
                onSearchPress={handleSearchPress}
                onBabyPress={handleBabyPress}
            />
            {showSearch && (
                <View className="w-full bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <View className="flex-row items-center w-full">
                        <TextInput
                            style={{ flex: 1, marginRight: 8, padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc' }}
                            placeholder= {t("chat.inputPlaceholder")}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        <TouchableOpacity
                            className="bg-gray-300 p-2 rounded-full items-center justify-center ml-3"
                            onPress={handleSearchClose}
                        >
                            <Entypo name="cross" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center ">
                        <TouchableOpacity
                            className="bg-blue-500 px-4 py-2 rounded m-1"
                            onPress={handleSubmitSearch}
                        >
                            <Text className="text-white">buscar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handlePrevResult}
                            className="bg-gray-200 px-3 py-2 rounded ml-1"
                        >
                            <AntDesign name="arrowdown" size={18} color="#333" />
                        </TouchableOpacity>

                        <Text>
                            {highlightedMessageIds.length > 0
                                ? `${currentHighlightIndex + 1} / ${highlightedMessageIds.length}`
                                : ' 0 / 0 '}
                        </Text>

                        <TouchableOpacity
                            onPress={handleNextResult}
                            className="bg-gray-200 px-3 py-2 rounded"
                        >
                            <AntDesign name="arrowup" size={18} color="#333" />
                        </TouchableOpacity>

                    </View>


                </View>

            )}
            {/* Modal de selección de bebés */}
            <BabySelectionModal
                visible={showBabyModal}
                babies={babies}
                selectedBaby={selectedBaby}
                onSelectBaby={handleSelectBaby}
                onClose={handleCloseBabyModal}
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
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoadingConversations ? (
                        <View className="flex-1 justify-center items-center py-8">
                            <ActivityIndicator size="small" color="#3B82F6" />
                            <Text className="text-gray-500 mt-2">
                                Cargando conversaciones de {selectedBaby?.name || 'todos los bebés'}...
                            </Text>
                        </View>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <View
                                    key={msg.id}
                                    // ✅ Medimos posición dentro del ScrollView
                                    onLayout={(event) => {
                                        const { y } = event.nativeEvent.layout;
                                        setMessagePositions((prev) => ({ ...prev, [msg.id]: y }));
                                    }}
                                >
                                    {msg.role === 'user' ? (
                                        <UserMessage text={msg.text} />
                                    ) : (
                                        <AssistantMessage
                                            messageId={msg.id}
                                            text={msg.text}
                                            isHighlighted={highlightedMessageIds.includes(msg.id)}
                                            highlightText={searchText}
                                            isFocused={highlightedMessageIds[currentHighlightIndex] === msg.id}
                                            feedback={feedbacks[msg.id]}
                                            onFeedback={handleFeedback}
                                        />
                                    )}
                                </View>
                            ))}

                            {isLoading && <LoadingMessage />}
                        </>
                    )}
                </ScrollView>


                {/* Input mejorado */}
                <View className="border-t border-gray-200 bg-white px-4 py-3">
                    <View className="flex-row items-end bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                        <TextInput
                            className="flex-1 px-4 py-3 text-base text-gray-800 min-h-[48px] max-h-[120px]"
                            placeholder={t("chat.inputPlaceholder")}
                            placeholderTextColor="#9CA3AF"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            style={{
                                textAlignVertical: 'center',
                            }}
                        />
                        <TouchableOpacity
                            testID="send-button"
                            accessibilityRole="button"
                            accessibilityLabel="Enviar mensaje"
                            className={`m-2 w-10 h-10 rounded-full items-center justify-center ${isSendDisabled ? 'bg-gray-300' : 'bg-blue-500'
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

            <SideMenu
                visible={isMenuVisible}
                onClose={handleCloseMenu}
                onChangeBaby={handleBabyPressFromMenu}
                onNavigateToChat={() => { }}
                onNavigateToFavorites={handleNavigateToFavorites}
                onNavigateToBabyProfile={handleNavigateToBabyProfile}
                onNavigateToCreateBaby={handleNavigateToCreateBaby}
                onNavigateToSettings={() => {
                    handleCloseMenu();
                    navigation.navigate('SettingsView');
                }}
                onNavigateToUserProfile={handleNavigateToUserProfile}
                onNavigateToSubscription={handleNavigateToSubscription}
                onLogout={handleLogout}
                babyName={selectedBaby?.name || ''}
                babyAgeLabel={selectedBabyAge}
            />
        </SafeAreaView>
    );
};

export default Chat;
