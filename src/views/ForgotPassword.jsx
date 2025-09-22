import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
    const navigation = useNavigation();
    const { sendPasswordResetEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim()) {
            return Alert.alert('Error', 'Por favor ingresa tu email');
        }

        try {
            setLoading(true);
            await sendPasswordResetEmail(email.trim());
            Alert.alert(
                'Email enviado',
                'Te hemos enviado un correo con las instrucciones para restablecer tu contraseña.',
                [
                    {
                        text: 'Volver al inicio',
                        onPress: () => navigation.navigate('SignIn')
                    }
                ]
            );
            setEmail(''); 
        } catch (e) {
            console.error('Error al enviar email de recuperación:', e);
            Alert.alert(
                'Error',
                e.message === 'User not found'
                    ? 'No encontramos ninguna cuenta con este email'
                    : 'No se pudo enviar el email de recuperación. Por favor, intenta nuevamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200">
                <Text className="text-xl font-bold text-blue-500 text-center">
                    Recuperar contraseña
                </Text>
            </View>

            <View className="p-4">
                <Text className="text-gray-600 mb-4 text-center">
                    Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
                </Text>

                <Input
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="mb-4"
                />

                <Button
                    title={loading ? 'Enviando...' : 'Enviar instrucciones'}
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-blue-500 border border-blue-500 mb-4"
                />

                <Button
                    title="Volver"
                    onPress={() => navigation.goBack()}
                    className="bg-gray-100 border border-gray-300"
                />
            </View>
        </SafeAreaView>
    );
};

export default ForgotPassword;