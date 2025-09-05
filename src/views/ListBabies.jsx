import { View, Text } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

const ListBabies = () => {
    const navigation = useNavigation();

    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-xl font-bold text-blue-500">Babies</Text>
            <Button
                title="Home"
                onPress={() => navigation.navigate('Home')}
                className="mb-4 bg-gray-100 border border-gray-300"
            />
        </View>
    )
}

export default ListBabies