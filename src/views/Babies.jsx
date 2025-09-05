import { View, Text, Platform } from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        const { data, error } = await createBaby(user.id, { name });
        setLoading(false);

        if (error) {
            console.error("Error creando bebé:", error.message);
        } else {
            console.log("Bebé creado:", data);
            setName("");
        }
    };

    return (
        <View className="w-full px-4">
            <Text className="text-xl font-bold text-blue-500">Babies</Text>

            <Button
                title="Home"
                onPress={() => navigation.navigate("Home")}
                className="mb-4 bg-gray-100 border border-gray-300"
            />

            <Input
                placeholder="Nombre"
                value={name}
                onChangeText={setName}
                className="mbwater: mb-2"
            />

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

            <Button
                title={loading ? "Guardando..." : "Crear bebé"}
                onPress={handleCreate}
                disabled={loading}
                className="mb-4 bg-gray-100 border border-gray-300"
            />
        </View>
    );
};

export default Babies;
