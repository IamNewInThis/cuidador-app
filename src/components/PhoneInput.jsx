// components/PhoneInput.jsx  (SOLO cambios dentro del componente)
import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useMemo, useState } from "react";
import Input from "./Input";

const PhoneInput = ({ value = "", onChange, onChangeText, className }) => {
    const [countryCode, setCountryCode] = useState("+56");
    const handleChange = onChange || onChangeText;

    // Mostrar SOLO el número local en el <Input />
    const localValue = useMemo(() => {
        const known = ["+56", "+1", "+55"];
        let v = String(value || "");
        for (const cc of [countryCode, ...known]) {
            if (v.startsWith(cc)) return v.slice(cc.length);
        }
        return v;
    }, [value, countryCode]);

    const emit = (cc, local) => {
        const digits = (local || "").replace(/\D/g, "");
        handleChange && handleChange(`${cc}${digits}`);
    };

    return (
        <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
            <Picker
                selectedValue={countryCode}
                onValueChange={(cc) => {
                    setCountryCode(cc);
                    emit(cc, localValue); // re-emite en E.164 al cambiar país
                }}
                style={{ width: 100 }}
            >
                <Picker.Item label="🇨🇱 +56" value="+56" />
                <Picker.Item label="🇺🇸 +1" value="+1" />
                <Picker.Item label="🇧🇷 +55" value="+55" />
            </Picker>

            <Input
                placeholder="Número"
                keyboardType="phone-pad"
                value={localValue}
                onChangeText={(text) => emit(countryCode, text)} // evita duplicar +56
                className="flex-1 border-0"
            />
        </View>
    );
};

export default PhoneInput;
