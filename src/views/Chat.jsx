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
    const [remaining, setRemaining] = useState(null); // mensajes restantes
    const [resetAt, setResetAt] = useState(null);     // hora en la que se reinicia el límite
    const [countdown, setCountdown] = useState("");
    const [tier, setTier] = useState("free"); // "free" o "subscriber"
    const [dailyLimit, setDailyLimit] = useState(10); // nuevo estado para el límite diario


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

    // 📊 Cargar estado inicial al montar el componente
    const fetchLimitStatus = async () => {
        if (!user?.id) return;

        try {
            const result = await ConversationsService.getMessageUsageStatus(user.id);

            console.log('📊 Estado inicial de límite:', result);

            if (!result) return;

            setTier(result.status);
            setRemaining(result.remaining || 0);
            setResetAt(result.resetAt);
            setDailyLimit(result.DAILY_LIMIT || 10);

            if (result.remaining === 0 && result.resetAt) {
                startCountdown(result.resetAt);
            }
        } catch (error) {
            console.error("Error verificando límite inicial:", error);
        }
    };

    useEffect(() => {
        fetchLimitStatus();
    }, [user?.id]);

    // Recargar cuando vuelve el foco a la pantalla
    useFocusEffect(
        useCallback(() => {
            fetchLimitStatus();
        }, [user?.id])
    );

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

    const handleConfirmProfileKeywords = async (messageId, profileKeywords) => {
        if (!session?.access_token) {
            console.error('No hay sesión activa');
            pushAssistantNotice('❌ Error: No hay sesión activa');
            return;
        }

        if (!profileKeywords?.baby_id || !profileKeywords?.keywords) {
            console.error('Datos de keywords incompletos:', profileKeywords);
            pushAssistantNotice('❌ Error: Datos incompletos');
            return;
        }

        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            console.log('📝 Confirmando keywords del perfil:', {
                baby_id: profileKeywords.baby_id,
                keywords: profileKeywords.keywords
            });

            const res = await fetch(`${API_URL}chat/confirm-profile-keywords`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    baby_id: profileKeywords.baby_id,  // ✅ Enviado desde el backend
                    keywords: profileKeywords.keywords  // ✅ Array completo de keywords
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Error HTTP: ${res.status}`);
            }

            const data = await res.json();
            console.log('✅ Respuesta del backend:', data);

            if (data.success) {
                // Actualizar el mensaje para marcar las keywords como guardadas
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === messageId
                            ? { ...msg, profileKeywords: null, keywordsSaved: true }
                            : msg
                    )
                );

                // Mostrar mensaje de confirmación
                const count = profileKeywords.keywords.length;
            } else {
                throw new Error(data.message || 'Error al guardar');
            }

        } catch (error) {
            console.error('❌ Error al confirmar keywords:', error);
            pushAssistantNotice('❌ Error al guardar las características. Intenta nuevamente.');
        }
    };

    const handleOnSendMessage = async () => {
        if (message.trim() === '' || isLoading) return;

        if (!session?.access_token) {
            pushAssistantNotice('Error: Debes iniciar sesión para usar el chat.');
            return;
        }

        const messageToSend = message.trim();
        setMessage('');
        setIsLoading(true);

        try {
            // 1️⃣ PRIMERO: Verificar y consumir el límite
            const limitResult = await ConversationsService.limitMessagesPerDay(user.id);

            console.log('📊 Resultado de verificación de límite:', limitResult);

            // 2️⃣ Si no se permite, detener inmediatamente
            if (!limitResult.allowed) {
                setTier(limitResult.tier);
                setRemaining(limitResult.remaining || 0);
                setResetAt(limitResult.resetAt);
                setDailyLimit(limitResult.DAILY_LIMIT || 10);

                if (limitResult.resetAt) {
                    startCountdown(limitResult.resetAt);
                    const resetTime = new Date(limitResult.resetAt);
                    const diffMs = resetTime - new Date();
                    const hours = Math.floor(diffMs / 3600000);
                    const mins = Math.floor((diffMs % 3600000) / 60000);
                    const secs = Math.floor((diffMs % 60000) / 1000);

                    pushAssistantNotice(
                        `Has alcanzado tu límite diario. Podrás volver a escribir en ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.`
                    );
                } else {
                    pushAssistantNotice('Has alcanzado tu límite de mensajes.');
                }

                setIsLoading(false);
                return; // 🛑 Detener aquí
            }

            // 3️⃣ Actualizar contador en UI inmediatamente
            setTier(limitResult.tier);
            setRemaining(limitResult.remaining || 0);
            setResetAt(limitResult.resetAt);
            setDailyLimit(limitResult.DAILY_LIMIT || 10);

            if (limitResult.remaining === 0 && limitResult.resetAt) {
                startCountdown(limitResult.resetAt);
            }

            // 4️⃣ Guardar mensaje del usuario en BD
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
                babyId: selectedBaby?.id || null,
            });

            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            console.log('Usando API_URL:', API_URL);
            const res = await fetch(`http://10.174.88.78:3000/api/chat`, {
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
            console.log('🔍 Respuesta completa del backend:', JSON.stringify(data, null, 2));
            console.log('� Keys de data:', Object.keys(data));
            console.log('�📝 data.profile_keywords:', data.profile_keywords);
            console.log('📝 Tipo de profile_keywords:', typeof data.profile_keywords);
            console.log('📝 Es undefined?', data.profile_keywords === undefined);
            console.log('📝 Es null?', data.profile_keywords === null);
            
            // 6️⃣ Procesar respuesta del modelo
            const assistantContent = data?.answer || 'Lo siento, no pude obtener una respuesta.';
            
            // Guardar el objeto completo de profile_keywords para enviarlo al backend
            let profileKeywordsData = null;
            if (data?.profile_keywords?.keywords && Array.isArray(data.profile_keywords.keywords) && data.profile_keywords.keywords.length > 0) {
                // Guardar el objeto completo con baby_id y keywords
                profileKeywordsData = {
                    baby_id: data.profile_keywords.baby_id,
                    keywords: data.profile_keywords.keywords
                };
                console.log('✅ Profile keywords detectados:', profileKeywordsData);
                console.log('📊 Total keywords:', data.profile_keywords.keywords.length);
                console.log('👶 Baby:', data.profile_keywords.baby_name);
                console.log('📋 Keywords completas:', JSON.stringify(data.profile_keywords.keywords, null, 2));
            } else {
                console.log('⚠️ No se detectaron keywords en este mensaje');
            }

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
                babyId: selectedBaby?.id || null,
                profileKeywords: profileKeywordsData, // ✅ Incluir objeto completo con baby_id y keywords
                keywordsSaved: false, // ✅ Inicialmente no guardadas
            });

            setTimeout(scrollToBottom, 100);

        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            pushAssistantNotice('Error al conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };


    // ⏱️ Función de cuenta regresiva
    const startCountdown = (resetTime) => {
        if (!resetTime) return;

        const target = new Date(resetTime);
        clearInterval(global._messageCountdownTimer);

        global._messageCountdownTimer = setInterval(() => {
            const diff = target - new Date();
            if (diff <= 0) {
                clearInterval(global._messageCountdownTimer);
                setCountdown("");
                setRemaining(dailyLimit);
                setResetAt(null);
                return;
            }

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        }, 1000);
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
                            placeholder={t("chat.inputPlaceholder")}
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
                                            profileKeywords={msg.profileKeywords}
                                            keywordsSaved={msg.keywordsSaved}
                                            onConfirmKeywords={handleConfirmProfileKeywords}
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
                    {/* 🔢 Mostrar contador solo para usuarios free */}
                    {tier === "free" && (
                        <>
                            {remaining > 0 ? (
                                <Text className="text-gray-500 text-xs mb-1 text-center">
                                    Te quedan {remaining}/{dailyLimit} mensajes hoy
                                </Text>
                            ) : remaining === 0 && countdown ? (
                                <Text className="text-red-500 text-xs mb-1 text-center">
                                    Límite alcanzado. Disponible en {countdown}
                                </Text>
                            ) : null}
                        </>
                    )}
                    <View className="flex-row items-end bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                        <TextInput
                            className="flex-1 px-4 py-3 text-base text-gray-800 min-h-[48px] max-h-[120px]"
                            placeholder={
                                remaining === 0
                                    ? `Límite alcanzado. Espera el reinicio...${resetAt ? ` (${new Date(resetAt).toLocaleTimeString()})` : ""
                                    }`
                                    : t("chat.inputPlaceholder")
                            }
                            placeholderTextColor="#9CA3AF"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            editable={remaining !== 0}
                            style={{
                                textAlignVertical: "center",
                                opacity: remaining === 0 ? 0.5 : 1,
                            }}
                        />

                        <TouchableOpacity
                            testID="send-button"
                            accessibilityRole="button"
                            accessibilityLabel="Enviar mensaje"
                            className={`m-2 w-10 h-10 rounded-full items-center justify-center ${remaining === 0 || isLoading ? "bg-gray-300" : "bg-blue-500"
                                }`}
                            onPress={handleOnSendMessage}
                            disabled={remaining === 0 || isLoading}
                        >
                            <Entypo name="paper-plane" size={20} color="white" />
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
