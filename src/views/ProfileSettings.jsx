import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import SideMenu from '../components/SideMenu';
import { getProfile, updateProfile } from '../services/ProfilesService';
import { getBabies } from '../services/BabiesService';
import { useAuth } from '../contexts/AuthContext';

const formatBabyAge = (birthdate) => {
    if (!birthdate) return '';

    const parsedDate = new Date(birthdate);
    if (Number.isNaN(parsedDate.getTime())) {
        return '';
    }

    const now = new Date();
    let years = now.getFullYear() - parsedDate.getFullYear();
    let months = now.getMonth() - parsedDate.getMonth();

    if (now.getDate() < parsedDate.getDate()) {
        months -= 1;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    years = Math.max(years, 0);
    months = Math.max(months, 0);

    if (years > 0 && months > 0) {
        return `${years} año${years !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}`;
    } else if (years > 0) {
        return `${years} año${years !== 1 ? 's' : ''}`;
    } else if (months > 0) {
        return `${months} mes${months !== 1 ? 'es' : ''}`;
    } else {
        return 'Recién nacido';
    }
};

const ProfileSettings = () => {
    const navigation = useNavigation();
    const { user, signOut } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [selectedBaby, setSelectedBaby] = useState(null);

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    // Calcular edad del bebé seleccionado
    const selectedBabyAge = selectedBaby?.birthdate ? formatBabyAge(selectedBaby.birthdate) : '';

    // Cargar bebé seleccionado cuando se enfoca la pantalla
    useFocusEffect(
        React.useCallback(() => {
            loadSelectedBaby();
        }, [])
    );

    const loadSelectedBaby = async () => {
        try {
            // Primero intentar con la key específica del usuario (usado en Chat)
            let babyData = await AsyncStorage.getItem(`selectedBaby_${user?.id}`);
            
            if (babyData) {
                // Es un ID, necesitamos buscar el bebé completo
                try {
                    const { data: babies } = await getBabies(user.id);
                    // Convertir babyData a número para comparar correctamente
                    const babyId = parseInt(babyData, 10);
                    const selectedBabyData = babies.find(baby => baby.id === babyId);
                    if (selectedBabyData) {
                        setSelectedBaby(selectedBabyData);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching baby by ID:', error);
                }
            }
            
            // Si no se encontró con la key específica, intentar con la key general
            babyData = await AsyncStorage.getItem('selectedBaby');
            
            if (babyData) {
                const parsedBaby = JSON.parse(babyData);
                setSelectedBaby(parsedBaby);
            }
        } catch (error) {
            console.error('Error loading selected baby in ProfileSettings:', error);
        }
    };

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

    // Menu functions
    const handleMenuPress = () => {
        setIsMenuVisible(true);
    };

    const handleCloseMenu = () => {
        setIsMenuVisible(false);
    };

    const handleNavigateToChat = async () => {
        if (selectedBaby) {
            try {
                await AsyncStorage.setItem(`selectedBaby_${user.id}`, selectedBaby.id.toString());
                await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBaby));
            } catch (error) {
                console.error('Error al guardar bebé seleccionado:', error);
            }
        }
        navigation.navigate('Chat');
    };

    const handleNavigateToFavorites = async () => {
        if (selectedBaby) {
            try {
                await AsyncStorage.setItem(`selectedBaby_${user.id}`, selectedBaby.id.toString());
                await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBaby));
            } catch (error) {
                console.error('Error al guardar bebé seleccionado:', error);
            }
        }
        navigation.navigate('Favorites');
    };

    const handleNavigateToProfile = async () => {
        if (selectedBaby) {
            try {
                await AsyncStorage.setItem(`selectedBaby_${user.id}`, selectedBaby.id.toString());
                await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBaby));
                
                // Navegar pasando el bebé como parámetro
                navigation.navigate('BabyDetail', { baby: selectedBaby });
            } catch (error) {
                console.error('Error al guardar bebé seleccionado:', error);
                // Navegar sin parámetros en caso de error
                navigation.navigate('BabyDetail');
            }
        } else {
            // Si no hay bebé seleccionado, navegar sin parámetros
            navigation.navigate('BabyDetail');
        }
    };

    const handleNavigateToCreateBaby = () => {
        navigation.navigate('Babies');
    }

    const handleNavigateToSubscription = () => {
        navigation.navigate('SubscriptionView');
    };

    const handleNavigateToLanguage = () => {
        console.log('Navigate to language settings');
        // navigation.navigate('LanguageSettings');
    };

    const handleNavigateToHelpCenter = () => {
        console.log('Navigate to help center');
        // navigation.navigate('HelpCenter');
    };

    const handleNavigateToTermsOfUse = () => {
        console.log('Navigate to terms of use');
        // navigation.navigate('TermsOfUse');
    };

    const handleNavigateToPrivacyPolicy = () => {
        console.log('Navigate to privacy policy');
        // navigation.navigate('PrivacyPolicy');
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
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
                        <Text className="text-2xl font-bold text-gray-900">Mi cuenta</Text>
                    </View>
                </View>
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

            {/* Side Menu */}
            <SideMenu
                visible={isMenuVisible}
                onClose={handleCloseMenu}
                onChangeBaby={() => navigation.navigate('BabyList')}
                onNavigateToChat={handleNavigateToChat}
                onNavigateToFavorites={handleNavigateToFavorites}
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToCreateBaby={handleNavigateToCreateBaby}
                onNavigateToAccount={() => {}} 
                onNavigateToSubscription={handleNavigateToSubscription}
                onNavigateToLanguage={handleNavigateToLanguage}
                onNavigateToHelpCenter={handleNavigateToHelpCenter}
                onNavigateToTermsOfUse={handleNavigateToTermsOfUse}
                onNavigateToPrivacyPolicy={handleNavigateToPrivacyPolicy}
                onLogout={handleLogout}
                babyName={selectedBaby?.name || "Sin seleccionar"}
                babyAgeLabel={selectedBabyAge}
                userEmail={user?.email || ""}
            />
        </SafeAreaView>
    );
};

export default ProfileSettings;
