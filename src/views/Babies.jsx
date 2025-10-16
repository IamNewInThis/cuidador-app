import { View, Text, Platform, Modal, Pressable, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, use } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from "@react-native-picker/picker";
import Button from "../components/Button";
import Input from "../components/Input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createBaby } from "../services/BabiesService";
import { createRelationship } from "../services/BabyRelationshipsService";
import { useAuth } from "../contexts/AuthContext";
import SideMenu from '../components/SideMenu';
import { Feather } from '@expo/vector-icons';
import { getBabies } from '../services/BabiesService';

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

const Babies = () => {
    const navigation = useNavigation();
    const { user, signOut } = useAuth();
    const [name, setName] = useState("");
    const [birthdate, setBirthdate] = useState(new Date());
    const [gender, setGender] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showRelationPicker, setShowRelationPicker] = useState(false);
    const [relationToBaby, setRelationToBaby] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [selectedBaby, setSelectedBaby] = useState(null);
    const selectedBabyAge = selectedBaby?.birthdate ? formatBabyAge(selectedBaby.birthdate) : '';

    const RELATIONS = [
        { label: "Madre", value: "Mother" },
        { label: "Padre", value: "Father" },
        { label: "Hermano", value: "Brother" },
        { label: "Hermana", value: "Sister" },
        { label: "Abuela", value: "Grandmother" },
        { label: "Abuelo", value: "Grandfather" },
        { label: "Tío", value: "Uncle" },
        { label: "Tía", value: "Aunt" },
        { label: "Primo", value: "Cousin" },
        { label: "Prima", value: "Cousin" },
        { label: "Otros", value: "Other" }
    ];

    const getRelationLabel = (value) => {
        const relation = RELATIONS.find(r => r.value === value);
        return relation ? relation.label : "Seleccionar relación";
    };
    
    useEffect(() => {
        loadSelectedBaby();
    }, [user]);    // Menu functions
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

    const handleNavigateToSubscription = () => {
        navigation.navigate('SubscriptionView');
    };
    
    const handleNavigateToProfile = () => {
        if (selectedBaby) {
            navigation.navigate('BabyDetail', { baby: selectedBaby });
        } else {
            // Si no hay bebé seleccionado, ir a la lista de bebés
            navigation.navigate('Babies');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const loadSelectedBaby = async () => {
        try {
            // Primero intentar con la key específica del usuario (usado en Chat)
            let babyData = await AsyncStorage.getItem(`selectedBaby_${user?.id}`);
            // console.log('Baby data from user-specific key:', babyData);
            
            if (babyData) {
                // Es un ID, necesitamos buscar el bebé completo
                try {
                    const { data: babies } = await getBabies(user.id);
                    const selectedBabyData = babies.find(baby => baby.id === babyData);
                    if (selectedBabyData) {
                        // console.log('Found complete baby data:', selectedBabyData);
                        setSelectedBaby(selectedBabyData);
                        // Guardar también en la key general para consistencia
                        await AsyncStorage.setItem('selectedBaby', JSON.stringify(selectedBabyData));
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching baby by ID:', error);
                }
            }
            
            // Si no se encontró con la key específica, intentar con la key general
            babyData = await AsyncStorage.getItem('selectedBaby');
            // console.log('Baby data from general key:', babyData);
            
            if (babyData) {
                const parsedBaby = JSON.parse(babyData);
                console.log('Parsed baby data:', parsedBaby);
                setSelectedBaby(parsedBaby);
            } else {
                console.log('No baby selected, loading global categories');
                // Si no hay bebé seleccionado, cargar categorías globales
                loadCategories();
            }
        } catch (error) {
            console.error('Error loading selected baby:', error);
            // En caso de error, intentar cargar categorías sin bebé específico
            loadCategories();
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        const babyData = {
            name,
            birthdate,
            gender: gender || null,
            weight: weight ? parseInt(weight) : null,
            height: height ? parseInt(height) : null
        };
        
        const { data, error } = await createBaby(user.id, babyData);
        
        if (error) {
            console.error("Error creando bebé:", error.message);
            setLoading(false);
        } else {
            console.log("Bebé creado:", data);
            
            // Crear la relación entre el usuario y el bebé
            if (relationToBaby && data && data.length > 0) {
                const babyId = data[0].id;
                console.log("Creando relación para baby ID:", babyId, "con relación:", relationToBaby);
                
                const relationshipResult = await createRelationship(user.id, babyId, relationToBaby);
                if (relationshipResult.error) {
                    console.error("Error creando relación:", relationshipResult.error);
                } else {
                    console.log("Relación creada exitosamente:", relationshipResult.data);
                }
            } else if (relationToBaby) {
                console.warn("No se pudo crear la relación: datos del bebé no disponibles");
            }
            
            // Limpiar formulario
            setName("");
            setGender("");
            setWeight("");
            setHeight("");
            setRelationToBaby("");
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 ">
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
                        <Text className="text-2xl font-bold text-gray-900">Crear perfil bebé</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 w-full px-6 py-6">
                <Input
                    placeholder="Nombre"
                    value={name}
                    onChangeText={setName}
                    className="mb-4"
                />

                <Button
                    title={`Nacimiento: ${birthdate.toLocaleDateString()}`}
                    onPress={() => setShowDatePicker(true)}
                    className="mb-4 bg-gray-100 border border-gray-300"
                />

                {Platform.OS === 'ios' ? (
                    <Button
                        title={gender ? (
                            gender === 'male' ? 'Masculino' :
                            gender === 'female' ? 'Femenino' :
                            gender === 'other' ? 'Otro' : 'Seleccionar género'
                        ) : 'Seleccionar género'}
                        onPress={() => setShowGenderPicker(true)}
                        className="mb-4 bg-gray-100 border border-gray-300"
                    />
                ) : (
                    <View className="mb-4 w-full border border-gray-300 rounded">
                        <Picker
                            selectedValue={gender}
                            onValueChange={(itemValue) => setGender(itemValue)}
                            style={{ height: 60 }}
                        >
                            <Picker.Item label="Seleccionar género" value="" />
                            <Picker.Item label="Masculino" value="male" />
                            <Picker.Item label="Femenino" value="female" />
                            <Picker.Item label="Otro" value="other" />
                        </Picker>
                    </View>
                )}

                {/* Relación con el bebé */}
                {Platform.OS === 'ios' ? (
                    <Button
                        title={getRelationLabel(relationToBaby)}
                        onPress={() => setShowRelationPicker(true)}
                        className="mb-4 bg-gray-100 border border-gray-300"
                    />
                ) : (
                    <View className="mb-4 w-full border border-gray-300 rounded">
                        <Picker
                            selectedValue={relationToBaby}
                            onValueChange={(itemValue) => setRelationToBaby(itemValue)}
                            style={{ height: 60 }}
                        >
                            <Picker.Item label="Seleccionar relación" value="" />
                            {RELATIONS.map(relation => (
                                <Picker.Item 
                                    key={relation.value}
                                    label={relation.label}
                                    value={relation.value}
                                />
                            ))}
                        </Picker>
                    </View>
                )}

                <Input
                    placeholder="Peso (Kilos)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    className="mb-4"
                />

                <Input
                    placeholder="Altura (centímetros)"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    className="mb-4"
                />

                {/* DateTimePicker para iOS como modal */}
                {Platform.OS === "ios" && showDatePicker && (
                    <Modal
                        visible={showDatePicker}
                        transparent={true}
                        animationType="slide"
                    >
                        <TouchableOpacity 
                            className="flex-1 bg-black/50 justify-end"
                            activeOpacity={1}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <View className="bg-white rounded-t-3xl">
                                {/* Handle indicator */}
                                <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
                                
                                {/* Header */}
                                <View className="px-6 pb-4 border-b border-gray-100">
                                    <View className="flex-row items-center justify-between">
                                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                            <Text className="text-blue-600 text-lg">Cancelar</Text>
                                        </TouchableOpacity>
                                        <Text className="text-lg font-semibold text-gray-900">
                                            Fecha de nacimiento
                                        </Text>
                                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                            <Text className="text-blue-600 text-lg font-semibold">Listo</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* DateTimePicker */}
                                <View className="px-4 py-6">
                                    <DateTimePicker
                                        value={birthdate}
                                        mode="date"
                                        display="spinner"
                                        onChange={(event, date) => {
                                            if (date) setBirthdate(date);
                                        }}
                                        maximumDate={new Date()}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                )}

                {/* DateTimePicker para Android */}
                {Platform.OS === "android" && showDatePicker && (
                    <DateTimePicker
                        value={birthdate}
                        mode="date"
                        display="default"
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setBirthdate(date);
                        }}
                        maximumDate={new Date()}
                    />
                )}

                <Button
                    title={loading ? "Guardando..." : "Crear bebé"}
                    onPress={handleCreate}
                    disabled={loading}
                    className="mb-4 bg-gray-100 border border-gray-300"
                />

                {Platform.OS === 'ios' && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showGenderPicker}
                        onRequestClose={() => setShowGenderPicker(false)}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white w-full">
                                <View className="flex-row justify-end border-b border-gray-200 p-2">
                                    <Pressable onPress={() => setShowGenderPicker(false)}>
                                        <Text className="text-blue-500 font-semibold text-lg px-4 py-2">Listo</Text>
                                    </Pressable>
                                </View>
                                <Picker
                                    selectedValue={gender}
                                    onValueChange={(itemValue) => setGender(itemValue)}
                                    style={{ height: 200 }}
                                >
                                    <Picker.Item label="Seleccionar género" value="" />
                                    <Picker.Item label="Masculino" value="male" />
                                    <Picker.Item label="Femenino" value="female" />
                                    <Picker.Item label="Otro" value="other" />
                                </Picker>
                            </View>
                        </View>
                    </Modal>
                )}

                {/* Modal para selector de relación en iOS */}
                {Platform.OS === 'ios' && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showRelationPicker}
                        onRequestClose={() => setShowRelationPicker(false)}
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white w-full">
                                <View className="flex-row justify-end border-b border-gray-200 p-2">
                                    <Pressable onPress={() => setShowRelationPicker(false)}>
                                        <Text className="text-blue-500 font-semibold text-lg px-4 py-2">Listo</Text>
                                    </Pressable>
                                </View>
                                <Picker
                                    selectedValue={relationToBaby}
                                    onValueChange={(itemValue) => setRelationToBaby(itemValue)}
                                    style={{ height: 200 }}
                                >
                                    <Picker.Item label="Seleccionar relación" value="" />
                                    {RELATIONS.map(relation => (
                                        <Picker.Item 
                                            key={relation.value}
                                            label={relation.label}
                                            value={relation.value}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>
                    </Modal>
                )}
            </ScrollView>

            {/* Side Menu */}
            <SideMenu
                visible={isMenuVisible}
                onClose={handleCloseMenu}
                onChangeBaby={() => navigation.navigate('BabyList')}
                onNavigateToChat={handleNavigateToChat}
                onNavigateToFavorites={handleNavigateToFavorites}
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToAccount={handleNavigateToAccount}
                onNavigateToSubscription={handleNavigateToSubscription}
                onNavigateToCreateBaby={() => {}} 
                onLogout={handleLogout}
                babyName={selectedBaby?.name || "Sin seleccionar"}
                babyAgeLabel={selectedBabyAge}
            />
        </SafeAreaView>
    );
};

export default Babies;