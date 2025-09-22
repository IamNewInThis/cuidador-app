import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import supabase from '../lib/supabase';

const ResetPasswordScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { updatePassword } = useAuth();

    // Debug: Imprimir todos los parámetros de la ruta
    // console.log('Parámetros de ruta:', route.params);
    // console.log('Query params:', route.params?.queryParams);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // console.log('[ResetPassword] Initial mount, route params:', route.params);

        const setRecoverySession = async (tokens) => {
            try {
                if (tokens?.access_token && tokens?.refresh_token) {
                    console.log('[ResetPassword] Intentando establecer sesión de recuperación...');
                    const { data, error } = await supabase.auth.setSession({
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token,
                    });

                    if (error) {
                        console.error('[ResetPassword] Error al establecer sesión:', error);
                        Alert.alert('Error', 'No se pudo establecer la sesión de recuperación');
                    } else {
                        console.log('[ResetPassword] Sesión establecida correctamente para:', data.session.user.email);
                    }
                }
            } catch (error) {
                console.error('[ResetPassword] Error al establecer sesión:', error);
                Alert.alert('Error', 'Hubo un problema al establecer la sesión');
            }
        };

        // Si recibimos los tokens como parámetros de navegación, los usamos
        if (route.params?.access_token && route.params?.type === 'recovery') {
            setRecoverySession(route.params);
        }

        // Check initial URL
        const getInitialURL = async () => {
            try {
                const url = await Linking.getInitialURL();
                console.log('Initial URL:', url);
                if (url) {
                    await handleUrl(url);
                }
            } catch (error) {
                console.error('Error getting initial URL:', error);
            }
        };

        getInitialURL();

        // Listen for new URLs
        const subscription = Linking.addEventListener('url', ({ url }) => {
            console.log('New URL event:', url);
            handleUrl(url);
        });

        return () => {
            subscription.remove();
        };
    }, []);


    const handleSubmit = async () => {
        if (!password.trim() || password.length < 6) {
            return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        }
        if (password !== confirm) {
            return Alert.alert('Error', 'Las contraseñas no coinciden');
        }

        try {
            setLoading(true);
            await updatePassword(password.trim());

            Alert.alert(
                'Éxito',
                'Tu contraseña ha sido actualizada correctamente',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Navegar a SignIn después de actualizar
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'SignIn' }],
                            });
                        }
                    }
                ]
            );
        } catch (e) {
            console.error('Error al actualizar contraseña:', e);
            if (e.message.includes('Auth session missing')) {
                Alert.alert(
                    'Error',
                    'Para cambiar tu contraseña, debes usar el enlace enviado a tu correo electrónico.',
                    [
                        {
                            text: 'Ir a recuperación',
                            onPress: () => navigation.navigate('ForgotPassword')
                        },
                        {
                            text: 'Cancelar',
                            style: 'cancel'
                        }
                    ]
                );
            } else {
                Alert.alert('Error', e.message || 'No se pudo actualizar la contraseña');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4">
            <Text className="text-xl font-bold text-blue-500 mb-4">Nueva contraseña</Text>

            <Text className="text-gray-700 mb-1">Contraseña</Text>
            <TextInput
                className="border border-gray-300 rounded p-2 mb-3"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Text className="text-gray-700 mb-1">Confirmar contraseña</Text>
            <TextInput
                className="border border-gray-300 rounded p-2 mb-6"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
            />

            <Button
                title={loading ? 'Guardando...' : 'Actualizar contraseña'}
                onPress={handleSubmit}
                disabled={loading}
                className="bg-blue-500 border border-blue-500"
            />
        </SafeAreaView>
    );
};

export default ResetPasswordScreen;
