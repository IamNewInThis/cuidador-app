import { View, Text } from 'react-native';
import React, { useState } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignIn = () => {
    const navigation = useNavigation();
    const { signIn, loading, authError, signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const {t} = useTranslation();

    const onSubmit = async () => {
        try {
            await signIn(email.trim(), password);
            
            navigation.navigate('Home');
        } catch (e) {
            console.error('Error al iniciar sesión:', e);
        }
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
            <Text className="text-2xl font-bold text-blue-500 mb-8">{t('auth.signInTitle')}</Text>

            <Input
                placeholder={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="mb-4"
                type="email"
            />
            <Input
                placeholder={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                className="mbwater: mb-2"
            />

            {!!authError && (
                <Text className="text-red-500 mb-4">
                    {authError.message || t('auth.errorSignIn')}
                </Text>
            )}

            <Button
                title={loading ? t('auth.signIn') : t('auth.signInTitle')}
                onPress={onSubmit}
                disabled={loading}
                className="mb-6"
            />

            <View className="flex-row items-center justify-center w-full mb-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
            </View>

            <Button
                title={t('auth.google')}
                icon={<AntDesign name="google" size={24} color="black" />}
                className="mb-4 bg-gray-100 border border-gray-300"
                onPress={signInWithGoogle}
            />
            <Button
                title={t('auth.apple')}
                icon={<FontAwesome name="apple" size={24} color="black" />}
                className="bg-gray-100 border border-gray-300"
                onPress={() => console.log('Sign in with Apple')}
            />

            <Text className="text-center text-gray-500 mt-6">
                <Text>{t('auth.haveAccount')}</Text>
                <Text
                    className="text-blue-500 font-bold"
                    onPress={() => navigation.navigate('SignUp')}
                >
                    {t('auth.goSignUp')}
                </Text>
            </Text>
        </SafeAreaView>
    );
};

export default SignIn;