import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const navigation = useNavigation();
    const { signOut } = useAuth();

    const signOutUser = async () => {
        try {
            await signOut();
            navigation.navigate('SignIn');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-white">
            <Text className="text-xl font-bold text-blue-500">Home</Text>
            <Button
                title="Ir al chat"
                onPress={() => navigation.navigate('Chat')}
                className="mb-4 bg-gray-100 border border-gray-300"
            />

            <Button
                title="Ir a Babies"
                onPress={() => navigation.navigate('Babies')}
                className="mt-4 bg-gray-100 border border-gray-300"
            />

            <Button
                title="Ir a list Babies"
                onPress={() => navigation.navigate('ListBabies')}
                className="mt-4 bg-gray-100 border border-gray-300"
            />

            <Button
                title="Ir a Profile Settings"
                onPress={() => navigation.navigate('ProfileSettings')}
                className="mt-4 bg-gray-100 border border-gray-300"
            />

            <Button
                title="Cerrar sesión"
                onPress={() => signOutUser()}
                className="mt-4 bg-gray-100 border border-gray-300"
            />
        </SafeAreaView>
    )
}

export default Home