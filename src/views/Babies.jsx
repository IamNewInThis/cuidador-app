import { View, Text, Platform, Modal, Pressable } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import Button from "../components/Button";
import Input from "../components/Input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createBaby } from "../services/BabiesService";
import { useAuth } from "../contexts/AuthContext";

const Babies = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [birthdate, setBirthdate] = useState(new Date());
    const [gender, setGender] = useState("");
    const [weight, setWeight] = useState("");
    const [height, setHeight] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [loading, setLoading] = useState(false);

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
        setLoading(false);

        if (error) {
            console.error("Error creando bebé:", error.message);
        } else {
            console.log("Bebé creado:", data);
            setName("");
            setGender("");
            setWeight("");
            setHeight("");
        }
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-white">
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

            <Button
                title={loading ? "Guardando..." : "Crear bebé"}
                onPress={handleCreate}
                disabled={loading}
                className="mb-4 bg-gray-100 border border-gray-300"
            />

            <Button
                title="Ir a Home"
                onPress={() => navigation.navigate("Home")}
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
        </SafeAreaView>
    );
};

export default Babies;