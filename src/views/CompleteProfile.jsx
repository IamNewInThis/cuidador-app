import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Input from '../components/Input';
import PhoneInput from '../components/PhoneInput';
import Button from '../components/Button';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const RELATIONS = [
    { value: 'mother', label: 'Madre' },
    { value: 'father', label: 'Padre' },
    { value: 'grandmother', label: 'Abuela' },
    { value: 'grandfather', label: 'Abuelo' },
    { value: 'aunt', label: 'Tía' },
    { value: 'uncle', label: 'Tío' },
    { value: 'sibling', label: 'Hermana/o' },
    { value: 'caregiver', label: 'Cuidador/a' },
    { value: 'other', label: 'Otro' },
];

const CompleteProfile = () => {
    const navigation = useNavigation();
    const { completeProfile, loading } = useAuth();
    const { t } = useTranslation();
    
    const [phone, setPhone] = useState('');
    const [birthdate, setBirthdate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [country, setCountry] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    
    const [relationToBaby, setRelationToBaby] = useState('');
    const [showRelationPicker, setShowRelationPicker] = useState(false);

    const COUNTRIES = [
        { label: "Chile", value: "CL", flag: "🇨🇱" },
        { label: "Brasil", value: "BR", flag: "🇧🇷" },
        { label: "Estados Unidos", value: "US", flag: "🇺🇸" }
    ];

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setBirthdate(selectedDate);
        }
    };

    const getCountryInfo = (value) => {
        const country = COUNTRIES.find(c => c.value === value);
        return country ? `${country.flag} ${country.label}` : "Seleccionar país";
    };

    const getRelationLabel = (value) => {
        const relation = RELATIONS.find(r => r.value === value);
        return relation ? relation.label : "Seleccionar relación";
    };

    const handleSubmit = async () => {
        // Validaciones
        if (!phone.trim()) {
            Alert.alert('Error', 'El teléfono es obligatorio');
            return;
        }

        if (!country) {
            Alert.alert('Error', 'Por favor selecciona tu país');
            return;
        }

        if (!relationToBaby) {
            Alert.alert('Error', 'Por favor selecciona tu relación con el bebé');
            return;
        }

        try {
            await completeProfile({
                phone: phone.trim(),
                birthdate: birthdate.toISOString().split('T')[0], // formato YYYY-MM-DD
                country,
                relationshipToBaby: relationToBaby
            });

            Alert.alert(
                '¡Perfil completado!',
                'Tu perfil ha sido completado exitosamente.',
                [{ text: 'Continuar', onPress: () => navigation.navigate('Home') }]
            );
        } catch (error) {
            Alert.alert(
                'Error',
                'Hubo un problema al completar tu perfil. Por favor intenta nuevamente.'
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-6 py-8">
                <Text className="text-2xl font-bold text-blue-500 mb-2 text-center">
                    Completa tu perfil
                </Text>
                <Text className="text-gray-600 mb-8 text-center">
                    Para brindarte la mejor experiencia, necesitamos algunos datos adicionales
                </Text>

                {/* Teléfono */}
                <Text className="text-gray-700 font-medium mb-2">Teléfono *</Text>
                <PhoneInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Número de teléfono"
                    className="mb-6"
                />

                {/* Fecha de nacimiento */}
                <Text className="text-gray-700 font-medium mb-2">Fecha de nacimiento</Text>
                <Button
                    title={`Nacimiento: ${birthdate.toLocaleDateString()}`}
                    onPress={() => setShowDatePicker(true)}
                    className="mt-4 mb-4 bg-gray-100 border border-gray-300"
                />
                 {showDatePicker && (
                    <DateTimePicker
                        value={birthdate}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setBirthdate(date);
                        }}
                    />
                )}

                {/* País */}
                <Text className="text-gray-700 font-medium mb-2">País *</Text>
                {Platform.OS === 'ios' ? (
                    <Button
                        title={getCountryInfo(country)}
                        onPress={() => setShowCountryPicker(true)}
                        className="mb-4 bg-gray-100 border border-gray-300"
                    />
                ) : (
                    <View className="mb-4 w-full border border-gray-300 rounded">
                        <Picker
                            testID="country-picker"
                            selectedValue={country}
                            onValueChange={(itemValue) => setCountry(itemValue)}
                            style={{ height: 60 }}
                        >
                            <Picker.Item label="Seleccionar país" value="" />
                            {COUNTRIES.map(country => (
                                <Picker.Item 
                                    key={country.value}
                                    label={`${country.flag} ${country.label}`}
                                    value={country.value}
                                />
                            ))}
                        </Picker>
                    </View>
                )}

                {/* Relación con el bebé */}
                <Text className="text-gray-700 font-medium mb-2">¿Cuál es tu relación con el bebé? *</Text>
                    {Platform.OS === 'ios' ? (
                        <Button
                            title={getRelationLabel(relationToBaby)}
                            onPress={() => setShowRelationPicker(true)}
                            className="mb-4 bg-gray-100 border border-gray-300"
                        />
                    ) : (
                        <View className="mb-4 w-full border border-gray-300 rounded">
                            <Picker
                                testID="relation-picker"
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

                {/* Botón de envío */}
                <Button
                    title={loading ? "Guardando..." : "Completar perfil"}
                    onPress={handleSubmit}
                    disabled={loading}
                    className="mb-4"
                />

                <Text className="text-xs text-gray-500 text-center">
                    Los campos marcados con * son obligatorios
                </Text>
            </ScrollView>

            {/* Modal para Country Picker en iOS */}
            {Platform.OS === 'ios' && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showCountryPicker}
                    onRequestClose={() => setShowCountryPicker(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white w-full">
                            <View className="flex-row justify-end border-b border-gray-200 p-2">
                                <Pressable onPress={() => setShowCountryPicker(false)}>
                                    <Text className="text-blue-500 font-semibold text-lg px-4 py-2">Listo</Text>
                                </Pressable>
                            </View>
                            <Picker
                                testID="country-picker-ios"
                                selectedValue={country}
                                onValueChange={(itemValue) => setCountry(itemValue)}
                            >
                                <Picker.Item label="Seleccionar país" value="" />
                                {COUNTRIES.map(country => (
                                    <Picker.Item 
                                        key={country.value}
                                        label={`${country.flag} ${country.label}`}
                                        value={country.value}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Modal para Relation Picker en iOS */}
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
                                testID="relation-picker-ios"
                                selectedValue={relationToBaby}
                                onValueChange={(itemValue) => setRelationToBaby(itemValue)}
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
        </SafeAreaView>
    );
};

export default CompleteProfile;