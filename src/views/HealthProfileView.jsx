import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react'
import { Feather } from '@expo/vector-icons';

const HealthProfileView = ({ navigation }) => {
    const [selectedAllergies, setSelectedAllergies] = useState({
        alimentarias: [],
        medicamentos: [],
        ambientales: [],
        dermatologicas: []
    });
    
    const [selectedConditions, setSelectedConditions] = useState({
        digestivas: [],
        respiratorias: [],
        dermatologicas: [],
        neurologicas: []
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentSubcategory, setCurrentSubcategory] = useState(null);

    // Datos de opciones
    const allergyOptions = {
        alimentarias: ['Huevo', 'Leche', 'Frutos secos', 'Mariscos', 'Pescado', 'Trigo', 'Soja', 'Sésamo'],
        medicamentos: ['Penicilina', 'Aspirina', 'Ibuprofeno', 'Sulfonamidas', 'Anticonvulsivos'],
        ambientales: ['Polen', 'Ácaros', 'Pelos de animales', 'Moho', 'Polvo'],
        dermatologicas: ['Níquel', 'Látex', 'Fragancias', 'Conservantes', 'Colorantes']
    };

    const conditionOptions = {
        digestivas: ['Reflujo gastroesofágico', 'Estreñimiento', 'Diarrea crónica', 'Intolerancia lactosa'],
        respiratorias: ['Asma', 'Bronquitis', 'Apnea del sueño', 'Rinitis alérgica'],
        dermatologicas: ['Dermatitis atópica', 'Eczema', 'Psoriasis', 'Urticaria'],
        neurologicas: ['Epilepsia', 'Migrañas', 'Trastorno del sueño', 'Retraso del desarrollo']
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const openModal = (category, subcategory) => {
        setCurrentCategory(category);
        setCurrentSubcategory(subcategory);
        setModalVisible(true);
    };

    const selectOption = (option) => {
        if (currentCategory === 'allergies') {
            const current = selectedAllergies[currentSubcategory] || [];
            if (current.includes(option)) {
                // Deseleccionar - remover de la lista
                setSelectedAllergies(prev => ({
                    ...prev,
                    [currentSubcategory]: current.filter(item => item !== option)
                }));
            } else {
                // Seleccionar - agregar a la lista
                setSelectedAllergies(prev => ({
                    ...prev,
                    [currentSubcategory]: [...current, option]
                }));
            }
        } else if (currentCategory === 'conditions') {
            const current = selectedConditions[currentSubcategory] || [];
            if (current.includes(option)) {
                // Deseleccionar - remover de la lista
                setSelectedConditions(prev => ({
                    ...prev,
                    [currentSubcategory]: current.filter(item => item !== option)
                }));
            } else {
                // Seleccionar - agregar a la lista
                setSelectedConditions(prev => ({
                    ...prev,
                    [currentSubcategory]: [...current, option]
                }));
            }
        }
        // NO cerrar el modal para permitir selección múltiple
    };

    const removeOption = (category, subcategory, option) => {
        if (category === 'allergies') {
            setSelectedAllergies(prev => ({
                ...prev,
                [subcategory]: prev[subcategory].filter(item => item !== option)
            }));
        } else if (category === 'conditions') {
            setSelectedConditions(prev => ({
                ...prev,
                [subcategory]: prev[subcategory].filter(item => item !== option)
            }));
        }
    };

    const CategorySection = ({ title, data, category, icon }) => (
        <View className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Feather name={icon} size={16} color="#3B82F6" />
                </View>
                <Text className="text-xl font-bold text-gray-800">{title}</Text>
            </View>
            
            {Object.entries(data).map(([subcategory, items]) => (
                <View key={subcategory} className="mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-lg font-semibold text-gray-700 capitalize">
                            {subcategory}
                        </Text>
                        <TouchableOpacity
                            onPress={() => openModal(category, subcategory)}
                            className="w-8 h-8 rounded-full bg-green-100 items-center justify-center"
                        >
                            <Feather name="plus" size={16} color="#10B981" />
                        </TouchableOpacity>
                    </View>
                    
                    {items.length > 0 ? (
                        <View className="flex-row flex-wrap">
                            {items.map((item, index) => (
                                <View key={index} className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center">
                                    <Text className="text-blue-800 text-sm mr-2">{item}</Text>
                                    <TouchableOpacity
                                        onPress={() => removeOption(category, subcategory, item)}
                                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                    >
                                        <Feather name="x" size={12} color="#3B82F6" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text className="text-gray-500 text-sm italic">Sin elementos agregados</Text>
                    )}
                </View>
            ))}
        </View>
    );

    const getCurrentOptions = () => {
        if (currentCategory === 'allergies') {
            return allergyOptions[currentSubcategory] || [];
        } else if (currentCategory === 'conditions') {
            return conditionOptions[currentSubcategory] || [];
        }
        return [];
    };

    const isOptionSelected = (option) => {
        if (currentCategory === 'allergies') {
            return selectedAllergies[currentSubcategory]?.includes(option) || false;
        } else if (currentCategory === 'conditions') {
            return selectedConditions[currentSubcategory]?.includes(option) || false;
        }
        return false;
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200">
                <View className="flex-row items-center justify-between px-5 py-4">
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="arrow-left" size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-semibold text-black">
                        Perfil de Salud
                    </Text>
                    <View className="w-8" />
                </View>
            </View>

            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
                <CategorySection 
                    title="Alergias"
                    data={selectedAllergies}
                    category="allergies"
                    icon="alert-triangle"
                />
                
                <CategorySection 
                    title="Condiciones médicas"
                    data={selectedConditions}
                    category="conditions"
                    icon="heart"
                />
            </ScrollView>

            {/* Modal para seleccionar opciones */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black bg-opacity-50">
                    <View className="bg-white rounded-t-3xl px-5 pt-6 pb-8" style={{ minHeight: '60%' }}>
                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-xl font-bold text-gray-800 capitalize">
                                Seleccionar {currentSubcategory}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            >
                                <Feather name="x" size={20} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        
                        <Text className="text-gray-600 text-sm mb-4">
                            Toca para seleccionar o deseleccionar opciones
                        </Text>
                        
                        <FlatList
                            data={getCurrentOptions()}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => {
                                const isSelected = isOptionSelected(item);
                                return (
                                    <TouchableOpacity
                                        onPress={() => selectOption(item)}
                                        className={`py-4 px-4 border-b border-gray-100 flex-row items-center justify-between ${
                                            isSelected ? 'bg-blue-50' : ''
                                        }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`text-lg ${
                                            isSelected ? 'text-blue-800 font-medium' : 'text-gray-800'
                                        }`}>
                                            {item}
                                        </Text>
                                        {isSelected ? (
                                            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                                                <Feather name="check" size={14} color="white" />
                                            </View>
                                        ) : (
                                            <View className="w-6 h-6 rounded-full border-2 border-gray-300" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            showsVerticalScrollIndicator={false}
                        />
                        
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            className="bg-blue-500 rounded-xl py-4 px-6 mt-6 items-center"
                        >
                            <Text className="text-white text-lg font-semibold">Listo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default HealthProfileView