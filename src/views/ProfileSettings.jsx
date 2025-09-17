import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Input from '../components/Input';
import { getProfile, updateProfile } from '../services/ProfilesService';
import { useAuth } from '../contexts/AuthContext';

const ProfileSettings = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    const canSave = useMemo(() => {
        return !!user?.id && !!fullName.trim();
    }, [user?.id, fullName]);

    const loadProfile = async () => {
        if (!user?.id) {
            setLoading(false); 
            return;
        }

        setLoading(true);
        const { data, error } = await getProfile(user.id);

        if (error) {
            console.error('Error loading profile:', error);
        } else {
            setProfile(data);
            setFullName(data?.name ?? '');
            setPhone(data?.phone ?? '');
        }

        setLoading(false);
    };

    useEffect(() => {
        navigation.setOptions?.({ headerShown: false });
        loadProfile();
    }, [user?.id]);

    const onSave = async () => {
        if (!user?.id || !canSave) return;
        setSaving(true);
        const { error } = await updateProfile(user.id, {
            name: fullName.trim(),
            phone: phone.trim() || null,
        });
        setSaving(false);
        if (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar');
            return;
        }
        Alert.alert('Guardado', 'Perfil actualizado correctamente.');
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-2 text-gray-600">Cargando perfil...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="p-4 bg-white border-b border-gray-200">
                <Text className="text-xl font-bold text-blue-500 text-center">Configuración de Perfil</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
                <View className="px-4">
                    <Text className="text-gray-700 mb-1">Nombre completo</Text>
                    <Input placeholder="Tu nombre" value={fullName} onChangeText={setFullName} />
                </View>

                <View className="px-4 mt-4">
                    <Text className="text-gray-700 mb-1">Teléfono</Text>
                    <Input placeholder="Ej: +54 11 5555-5555" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>

                <View className="px-4 mt-6">
                    <Button
                        title={saving ? 'Guardando...' : 'Guardar cambios'}
                        onPress={onSave}
                        disabled={!canSave || saving}
                        className="bg-blue-500 border border-blue-500"
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
        </SafeAreaView>
    );
};

export default ProfileSettings;
