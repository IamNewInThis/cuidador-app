import { View, Text, Platform, Modal, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useMemo, useState } from "react";
import Input from "./Input";

const COUNTRY_CODES = [
    { label: "Chile", code: "+56", flag: "🇨🇱" },
    { label: "Estados Unidos", code: "+1", flag: "🇺🇸" },
    { label: "Brasil", code: "+55", flag: "🇧🇷" }
];

const PhoneInput = ({ value = "", onChange, onChangeText, className }) => {
    const [countryCode, setCountryCode] = useState("+56");
    const [showPicker, setShowPicker] = useState(false);
    const handleChange = onChange || onChangeText;

    const selectedCountry = useMemo(() => 
        COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0]
    , [countryCode]);

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
        <>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50">
                {Platform.OS === 'ios' ? (
                    <Pressable 
                        onPress={() => setShowPicker(true)}
                        className="py-3 px-2 flex-row items-center justify-center"
                    >
                        <Text className="text-base">
                            {selectedCountry.flag} {selectedCountry.code}
                        </Text>
                    </Pressable>
                ) : (
                    <View className="w-[130px]">
                        <Picker
                            selectedValue={countryCode}
                            onValueChange={(cc) => {
                                setCountryCode(cc);
                                emit(cc, localValue);
                            }}
                            style={{ height: 60 }}
                        >
                            {COUNTRY_CODES.map(country => (
                                <Picker.Item 
                                    key={country.code}
                                    label={`${country.flag} ${country.code}`}
                                    value={country.code}
                                />
                            ))}
                        </Picker>
                    </View>
                )}

                <Input
                    placeholder="Número"
                    keyboardType="phone-pad"
                    value={localValue}
                    onChangeText={(text) => emit(countryCode, text)}
                    className="flex-1 border-0"
                />
            </View>

            {Platform.OS === 'ios' && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showPicker}
                    onRequestClose={() => setShowPicker(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white w-full">
                            <View className="flex-row justify-end border-b border-gray-200 p-2">
                                <Pressable onPress={() => setShowPicker(false)}>
                                    <Text className="text-blue-500 font-semibold text-lg px-4 py-2">Listo</Text>
                                </Pressable>
                            </View>
                            <Picker
                                selectedValue={countryCode}
                                onValueChange={(cc) => {
                                    setCountryCode(cc);
                                    emit(cc, localValue);
                                }}
                            >
                                {COUNTRY_CODES.map(country => (
                                    <Picker.Item 
                                        key={country.code}
                                        label={`${country.flag} ${country.label} ${country.code}`} 
                                        value={country.code}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>
                </Modal>
            )}
        </>
    );
};

export default PhoneInput;