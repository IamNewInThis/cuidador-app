// src/views/SignUp.js
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Modal, Pressable  } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../components/Input';
import Button from '../components/Button';
import PhoneInput from '../components/PhoneInput';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const SignUp = () => {
    const navigation = useNavigation();
    const { signUp, loading, authError } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showRelationPicker, setShowRelationPicker] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [birthdate, setBirthdate] = useState(new Date());
    const [relationToBaby, setRelationToBaby] = useState('');
    const [country, setCountry] = useState('');
    const {t} = useTranslation();

    const RELATIONS = [
        { label: "Madre", value: "mother" },
        { label: "Padre", value: "father" },
        { label: "Hermano", value: "brother" },
        { label: "Hermana", value: "sister" },
        { label: "Abuela", value: "grandmother" },
        { label: "Abuelo", value: "grandfather" },
        { label: "Tío", value: "uncle" },
        { label: "Tía", value: "aunt" },
        { label: "Primo", value: "cousin" },
        { label: "Prima", value: "cousin" },
        { label: "Otros", value: "other" }
    ];

    const COUNTRIES = [
        { label: "Chile", value: "CL", flag: "🇨🇱" },
        { label: "Brasil", value: "BR", flag: "🇧🇷" },
        { label: "Estados Unidos", value: "US", flag: "🇺🇸" }
    ];

    const getRelationLabel = (value) => {
        const relation = RELATIONS.find(r => r.value === value);
        return relation ? relation.label : "Seleccionar relación";
    };

    const getCountryInfo = (value) => {
        const country = COUNTRIES.find(c => c.value === value);
        return country ? `${country.flag} ${country.label}` : "Seleccionar país";
    };

    const onSubmit = async () => {
        try {
            await signUp({ email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim(), birthdate: birthdate.toISOString(), relation_to_baby: relationToBaby, country: country });
            navigation.navigate('Home');
        } catch (_) { /* authError ya está seteado en el contexto */ }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View className="flex-1 items-center justify-center px-6">
                        <Text className="text-2xl font-bold text-blue-500 mb-8">{t('auth.signUpTitle')}</Text>

                        <Input
                            placeholder={t('auth.fullName')}
                            value={fullName}
                            onChangeText={setFullName}
                            className="mb-4"
                        />
                        <Input
                            placeholder={t('auth.email')}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="mb-4"
                        />

                        <PhoneInput value={phone} onChangeText={setPhone} className="mb-6" />

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
                        
                        {Platform.OS === 'ios' ? (
                            <Button
                                title={getCountryInfo(country)}
                                onPress={() => setShowCountryPicker(true)}
                                className="mb-4 bg-gray-100 border border-gray-300"
                            />
                        ) : (
                            <View className="mb-4 w-full border border-gray-300 rounded">
                                <Picker
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


                        <Input
                            placeholder={t('auth.password')}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            className="mb-6"
                        />

                        {!!authError && (
                            <Text className="text-red-500 mb-4">
                                {authError.message || t('auth.errorSignUp')}
                            </Text>
                        )}

                        <Button
                            title={loading ? t('auth.signUp') : t('auth.signUpTitle')}
                            onPress={onSubmit}
                            disabled={loading}
                            className="mb-6"
                        />

                        <View className="flex-row items-center justify-center w-full mb-6">
                            <View className="flex-1 h-px bg-gray-300" />
                            <Text className="mx-4 text-gray-500">{t('auth.or')}</Text>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>

                        <Button
                            title={t('auth.google')}
                            icon={<AntDesign name="google" size={24} color="black" />}
                            className="mb-4 bg-gray-100 border border-gray-300"
                            onPress={() => console.log('Sign up with Google')}
                        />
                        {Platform.OS === 'ios' && (
                            <Button
                                title={t('auth.apple')}
                                icon={<AntDesign name="apple1" size={24} color="black" />}
                                className="bg-gray-100 border border-gray-300"
                                onPress={() => console.log('Sign up with Apple')}
                            />
                        )}

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

                        <Text className="text-center text-gray-500 mt-6">
                            {t('auth.haveAccount')}{' '}
                            <Text
                                className="text-blue-500 font-bold"
                                onPress={() => navigation.navigate('SignIn')}
                            >
                                {t('auth.signInTitle')}
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;