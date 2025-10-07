import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Platform, Modal, Dimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ContextMenuView } from 'react-native-ios-context-menu';

const UserMessage = ({ text }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [messageLayout, setMessageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
    const slideAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const messageRef = useRef();

    const handleCopyMessage = async () => {
        try {
            await Clipboard.setStringAsync(text);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            hideMenu();
        } catch (error) {
            console.error('Error al copiar:', error);
            hideMenu();
        }
    };

    const showMenuAnimation = (event) => {
        if (Platform.OS === 'android') {
            // Medimos la posición del mensaje
            messageRef.current?.measure((x, y, width, height, pageX, pageY) => {
                const screenWidth = Dimensions.get('window').width;
                const menuWidth = 120; // Ancho del menú más grande
                
                // Calculamos la posición para que aparezca encima y centrado
                let menuX = pageX + (width / 2) - (menuWidth / 2);
                let menuY = pageY - 60; // 60px arriba del mensaje (más espacio)
                
                // Ajustamos si se sale de los bordes
                if (menuX < 15) menuX = 15;
                if (menuX + menuWidth > screenWidth - 15) menuX = screenWidth - menuWidth - 15;
                if (menuY < 100) menuY = pageY + height + 15; // Si no hay espacio arriba, mostrarlo abajo
                
                setMenuPosition({ x: menuX, y: menuY });
                setMessageLayout({ width, height, x: pageX, y: pageY });
                setShowMenu(true);
                
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: 1,
                        duration: 200,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }
    };

    const hideMenu = () => {
        if (!showMenu) return;
        
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 150,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowMenu(false);
        });
    };

    // Configuración del menú iOS nativo
    const menuConfig = {
        menuTitle: '',
        menuItems: [
            {
                actionKey: 'copy',
                actionTitle: 'Copiar',
                icon: {
                    iconType: 'SYSTEM',
                    iconValue: 'doc.on.doc',
                },
            },
        ],
    };

    const handlePressMenuItem = ({ nativeEvent }) => {
        if (nativeEvent.actionKey === 'copy') {
            handleCopyMessage();
        }
    };

    // Componente del mensaje
    const MessageContent = () => (
        <View className="bg-blue-600 rounded-2xl rounded-tr-none px-5 py-4">
            <Text className="text-white text-lg leading-6">{text}</Text>
        </View>
    );

    return (
        <View className="my-2">
            <View className="flex-row justify-end items-end">
                {Platform.OS === 'ios' ? (
                    <View style={{ maxWidth: '85%' }}>
                        <ContextMenuView
                            menuConfig={menuConfig}
                            onPressMenuItem={handlePressMenuItem}
                        >
                            <MessageContent />
                        </ContextMenuView>
                    </View>
                ) : (
                    <View style={{ maxWidth: '85%' }}>
                        <TouchableOpacity
                            ref={messageRef}
                            onLongPress={showMenuAnimation}
                            delayLongPress={400}
                            activeOpacity={0.8}
                        >
                            <MessageContent />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Menú contextual estilo ChatGPT para Android */}
            {Platform.OS === 'android' && (
                <Modal
                    visible={showMenu}
                    transparent={true}
                    animationType="none"
                    onRequestClose={hideMenu}
                >
                    {/* Overlay transparente para cerrar el menú */}
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={hideMenu}
                    >
                        {/* Menú contextual */}
                        <Animated.View
                            style={{
                                position: 'absolute',
                                left: menuPosition.x,
                                top: menuPosition.y,
                                opacity: opacityAnim,
                                transform: [
                                    {
                                        translateY: slideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [10, 0],
                                        }),
                                    },
                                    {
                                        scale: slideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.9, 1],
                                        }),
                                    },
                                ],
                                backgroundColor: '#2D3748', // Fondo oscuro como ChatGPT
                                borderRadius: 12,
                                paddingVertical: 8,
                                paddingHorizontal: 6,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.4,
                                shadowRadius: 6,
                                elevation: 12,
                                minWidth: 120,
                            }}
                        >
                            <TouchableOpacity
                                onPress={handleCopyMessage}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderRadius: 8,
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="copy-outline" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '500' }}>
                                    Copiar
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
};

export default UserMessage;
