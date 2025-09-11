import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from 'react'
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Button from '../components/Button';
import { getBabies } from '../services/BabiesService';
import { useAuth } from '../contexts/AuthContext';

const ListBabies = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [babies, setBabies] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchBabies = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        const { data, error } = await getBabies(user.id);
        
        if (error) {
            console.error('Error fetching babies:', error.message);
        } else {
            setBabies(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isFocused) {
            fetchBabies();
        }
    }, [isFocused, user?.id]);

    const openDetail = (baby) => {
        navigation.navigate('BabyDetail', { baby });
    };

    const renderBaby = ({ item }) => (
        <View className="bg-white p-4 mb-3 mx-4 rounded-lg border border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-2" onPress={() => openDetail(item)}>{item.name}</Text>
            <Text className="text-sm text-gray-600 mb-1">
                Nacimiento: {new Date(item.birthdate).toLocaleDateString()}
            </Text>
            {item.gender && (
                <Text className="text-sm text-gray-600 mb-1">
                    Género: {item.gender === 'male' ? 'Masculino' : item.gender === 'female' ? 'Femenino' : 'Otro'}
                </Text>
            )}
            {item.weight && (
                <Text className="text-sm text-gray-600 mb-1">
                    Peso: {item.weight} kilos
                </Text>
            )}
            {item.height && (
                <Text className="text-sm text-gray-600 mb-1">
                    Altura: {item.height} centímetros
                </Text>
            )}
            <View className="mt-3">
                <Button title="Ver / Editar" onPress={() => openDetail(item)} className="bg-blue-500 border border-blue-500" />
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-2 text-gray-600">Cargando bebés...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200">
                <Text className="text-xl font-bold text-blue-500 text-center">Lista de Bebés</Text>
            </View>
            
            {babies.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Text className="text-gray-500 text-center mb-4">No hay bebés registrados</Text>
                    <Button
                        title="Agregar Bebé"
                        onPress={() => navigation.navigate('Babies')}
                        className="mb-4 bg-blue-500 border border-blue-500"
                    />
                </View>
            ) : (
                <FlatList
                    data={babies}
                    renderItem={renderBaby}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
            
            <View className="p-4 bg-white border-t border-gray-200">
                <Button
                    title="Volver a Home"
                    onPress={() => navigation.navigate('Home')}
                    className="mb-2 bg-gray-100 border border-gray-300"
                />
                <Button
                    title="Agregar Nuevo Bebé"
                    onPress={() => navigation.navigate('Babies')}
                    className="bg-blue-500 border border-blue-500"
                />
            </View>
        </SafeAreaView>
    )
}

export default ListBabies;