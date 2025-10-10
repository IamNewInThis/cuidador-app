import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import ChatSideMenu from '../components/chat/ChatSideMenu';
import { updateBaby, deleteBaby } from '../services/BabiesService';
import { useAuth } from '../contexts/AuthContext';

const BabyDetail = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { user, signOut } = useAuth();
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const babyParam = route.params?.baby ?? {};

    const [name, setName] = useState(babyParam.name ?? '');
    const [birthdate, setBirthdate] = useState(() => {
        if (!babyParam.birthdate) return '';
        try {
            const d = new Date(babyParam.birthdate);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } catch {
            return '';
        }
    });
    const [gender, setGender] = useState(babyParam.gender ?? '');
    const [weight, setWeight] = useState(babyParam.weight ? String(babyParam.weight) : '');
    const [height, setHeight] = useState(babyParam.height ? String(babyParam.height) : '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        navigation.setOptions?.({ headerShown: false });
    }, [navigation]);

    const canSave = useMemo(() => {
        return !!name?.trim();
    }, [name]);

    const onSave = async () => {
        if (!user?.id || !babyParam?.id) return;
        if (!canSave) return;
        setSaving(true);
        const updates = {
            name: name.trim(),
            birthdate: birthdate ? new Date(birthdate).toISOString() : null,
            gender: gender || null,
            weight: weight ? Number(weight) : null,
            height: height ? Number(height) : null,
        };
        const { error } = await updateBaby(user.id, babyParam.id, updates);
        setSaving(false);
        if (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar');
            return;
        }
        Alert.alert('Guardado', 'Los datos del bebé se actualizaron correctamente.', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };

    const confirmDelete = () => {
        Alert.alert(
            'Eliminar bebé',
            'Esta acción no se puede deshacer. ¿Deseas continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: onDelete },
            ]
        );
    };

    const onDelete = async () => {
        if (!user?.id || !babyParam?.id) return;
        setSaving(true);
        const { error } = await deleteBaby(user.id, babyParam.id);
        setSaving(false);
        if (error) {
            Alert.alert('Error', error.message || 'No se pudo eliminar');
            return;
        }
        Alert.alert('Eliminado', 'El bebé fue eliminado correctamente.', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };

    // Menu functions
    const handleMenuPress = () => {
        setIsMenuVisible(true);
    };

    const handleCloseMenu = () => {
        setIsMenuVisible(false);
    };

    const handleNavigateToChat = () => {
        navigation.navigate('Chat');
    };

    const handleNavigateToFavorites = () => {
        navigation.navigate('Favorites');
    };

    const handleNavigateToAccount = () => {
        navigation.navigate('ProfileSettings');
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-6 py-4 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={handleMenuPress}
                            className="p-2 -ml-2 mr-3"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name="menu" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-bold text-gray-900">Perfil de {name || 'Bebé'}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
                <View className="px-4">
                    <Text className="text-gray-700 mb-1">Nombre</Text>
                    <Input
                        placeholder="Nombre"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View className="px-4 mt-4">
                    <Text className="text-gray-700 mb-1">Fecha de nacimiento (YYYY-MM-DD)</Text>
                    <Input
                        placeholder="YYYY-MM-DD"
                        value={birthdate}
                        onChangeText={setBirthdate}
                    />
                </View>

                <View className="px-4 mt-4">
                    <Text className="text-gray-700 mb-1">Género (male/female/other)</Text>
                    <Input
                        placeholder="male | female | other"
                        value={gender}
                        onChangeText={setGender}
                    />
                </View>

                <View className="px-4 mt-4">
                    <Text className="text-gray-700 mb-1">Peso (kilos)</Text>
                    <Input
                        placeholder="Ej: 3200"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                    />
                </View>

                <View className="px-4 mt-4">
                    <Text className="text-gray-700 mb-1">Altura (centímetros)</Text>
                    <Input
                        placeholder="Ej: 50"
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                    />
                </View>

                <View className="px-4 mt-6">
                    <Button
                        title={saving ? 'Guardando...' : 'Guardar cambios'}
                        onPress={onSave}
                        disabled={!canSave || saving}
                        className="bg-blue-500 border border-blue-500"
                    />
                </View>

                <View className="px-4 mt-3">
                    <Button
                        title="Eliminar bebé"
                        onPress={confirmDelete}
                        className="bg-red-500 border border-red-500"
                    />
                </View>

                <View className="px-4 mt-3 mb-8">
                    <Button
                        title="Volver"
                        onPress={() => navigation.goBack()}
                        className="bg-gray-100 border border-gray-300"
                    />
                </View>
            </ScrollView>

            {/* Side Menu */}
            <ChatSideMenu
                visible={isMenuVisible}
                onClose={handleCloseMenu}
                onChangeBaby={() => {}} // No aplica aquí
                onNavigateToChat={handleNavigateToChat}
                onNavigateToFavorites={handleNavigateToFavorites}
                onNavigateToProfile={() => {}} // Ya estamos aquí
                onNavigateToAccount={handleNavigateToAccount}
                onLogout={handleLogout}
                babyName={name || 'Tu bebé'}
                babyAgeLabel=""
            />
        </SafeAreaView>
    );
};

export default BabyDetail;
