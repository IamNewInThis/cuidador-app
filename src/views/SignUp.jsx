// src/views/SignUp.js
import React, { useState } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
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
    const [birthdate, setBirthdate] = useState(new Date());
    const [relationToBaby, setRelationToBaby] = useState('');
    const [country, setCountry] = useState('');
    const {t} = useTranslation();

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
                            className="mb-4 bg-gray-100 border border-gray-300"
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

                        <View className="mb-4 w-full max-w-xs border border-gray-300 rounded">
                            <Picker
                                selectedValue={relationToBaby}
                                onValueChange={(itemValue) => setRelationToBaby(itemValue)}
                                style={{ height: 50 }}
                            >
                                <Picker.Item label="Seleccionar relación" value="" />
                                <Picker.Item label="Madre" value="mother" />
                                <Picker.Item label="Padre" value="father" />
                                <Picker.Item label="Hermano" value="brother" />
                                <Picker.Item label="Hermana" value="sister" />
                                <Picker.Item label="Abuela" value="grandmother" />
                                <Picker.Item label="Abuelo" value="grandfather" />
                                <Picker.Item label="Tío" value="uncle" />
                                <Picker.Item label="Tía" value="aunt" />
                                <Picker.Item label="Primo" value="cousin" />
                                <Picker.Item label="Prima" value="cousin" />
                                <Picker.Item label="Otros" value="other" />
                            </Picker>
                        </View>
                        
                        
                        <View className="mb-4 w-full max-w-xs border border-gray-300 rounded">
                            <Picker
                                selectedValue={country}
                                onValueChange={(itemValue) => setCountry(itemValue)}
                                style={{ height: 50 }}
                            >
                                <Picker.Item label="Seleccionar país" value="" />
                                <Picker.Item label="Chile" value="CL" />
                                <Picker.Item label="Brasil" value="BR" />
                                <Picker.Item label="Estados Unidos" value="US" />
                            </Picker>
                        </View>


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
                        <Button
                            title={t('auth.apple')}
                            icon={<AntDesign name="apple1" size={24} color="black" />}
                            className="bg-gray-100 border border-gray-300"
                            onPress={() => console.log('Sign up with Apple')}
                        />

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
