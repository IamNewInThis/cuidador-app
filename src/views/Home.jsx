import { View, Text, SafeAreaView } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

const Home = () => {
    const navigation = useNavigation();

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
        </SafeAreaView>
    )
}

export default Home