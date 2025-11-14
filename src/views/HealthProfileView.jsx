import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react'
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { getBabies } from '../services/BabiesService';
import MedicalConditionsService from '../services/MedicalConditionsService';

const HealthProfileView = ({ navigation }) => {
    const { user } = useAuth();
    const [baby, setBaby] = useState(null);
    const [loading, setLoading] = useState(false);
    
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

    const [existingConditions, setExistingConditions] = useState([]);
    const [predefinedConditions, setPredefinedConditions] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [currentSubcategory, setCurrentSubcategory] = useState(null);
    const [saving, setSaving] = useState(false);

    // Cargar baby desde AsyncStorage
    useEffect(() => {
        loadBaby();
        loadPredefinedConditions();
    }, []);

    const loadBaby = async () => {
        try {
            // Intentar cargar desde AsyncStorage
            let babyData = await AsyncStorage.getItem(`selectedBaby_${user?.id}`);
            
            if (babyData && user?.id) {
                try {
                    const { data: babies } = await getBabies(user.id);
                    const selectedBabyData = babies.find(baby => baby.id === babyData);
                    if (selectedBabyData) {
                        setBaby(selectedBabyData);
                        return;
                    }
                } catch (error) {
                    console.error('Error fetching baby by ID:', error);
                }
            }
            
            // Fallback a la key general
            babyData = await AsyncStorage.getItem('selectedBaby');
            if (babyData) {
                const parsedBaby = JSON.parse(babyData);
                setBaby(parsedBaby);
            }
        } catch (error) {
            console.error('Error loading baby:', error);
        }
    };

    const loadPredefinedConditions = async () => {
        try {
            const conditions = await MedicalConditionsService.getAllPredefinedConditions();
            setPredefinedConditions(conditions);
        } catch (error) {
            console.error('Error loading predefined conditions:', error);
        }
    };

    const loadExistingConditions = async () => {
        if (!baby?.id) return;
        
        try {
            const conditions = await MedicalConditionsService.getMedicalConditionsByBaby(baby.id);
            setExistingConditions(conditions || []);
            
            // Mapear las condiciones existentes a selectedConditions
            const mappedConditions = {
                digestivas: [],
                respiratorias: [],
                dermatologicas: [],
                neurologicas: []
            };

            conditions.forEach(condition => {
                const categoryName = condition.medical_conditions_category?.name?.toLowerCase();
                
                switch (categoryName) {
                    case 'digestive':
                        mappedConditions.digestivas.push(condition.condition_name);
                        break;
                    case 'respiratory':
                        mappedConditions.respiratorias.push(condition.condition_name);
                        break;
                    case 'dermatological':
                        mappedConditions.dermatologicas.push(condition.condition_name);
                        break;
                    case 'neurological':
                        mappedConditions.neurologicas.push(condition.condition_name);
                        break;
                }
            });

            setSelectedConditions(mappedConditions);
        } catch (error) {
            console.error('Error loading existing conditions:', error);
        }
    };

    // Cargar condiciones existentes cuando cambie el baby
    useEffect(() => {
        if (baby?.id) {
            loadExistingConditions();
        }
    }, [baby?.id]);

    // Datos de opciones
    const allergyOptions = {
        alimentarias: ['Huevo', 'Leche', 'Frutos secos', 'Mariscos', 'Pescado', 'Trigo', 'Soja', 'Sésamo'],
        medicamentos: ['Penicilina', 'Aspirina', 'Ibuprofeno', 'Sulfonamidas', 'Anticonvulsivos'],
        ambientales: ['Polen', 'Ácaros', 'Pelos de animales', 'Moho', 'Polvo'],
        dermatologicas: ['Níquel', 'Látex', 'Fragancias', 'Conservantes', 'Colorantes']
    };

    // Mapear condiciones predefinidas desde la base de datos
    const conditionOptions = {
        digestivas: predefinedConditions[1]?.conditions || [],
        respiratorias: predefinedConditions[2]?.conditions || [],
        dermatologicas: predefinedConditions[3]?.conditions || [],
        neurologicas: predefinedConditions[4]?.conditions || []
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

    // Función para mapear subcategoría a category_id de base de datos
    const getCategoryIdForSubcategory = (subcategory) => {
        switch (subcategory) {
            case 'digestivas':
                return 1; // Digestive
            case 'respiratorias':
                return 2; // Respiratory
            case 'dermatologicas':
                return 3; // Dermatological
            case 'neurologicas':
                return 4; // Neurological
            default:
                return null;
        }
    };

    // Función para guardar condiciones médicas
    const saveMedicalConditions = async () => {
        if (!baby?.id) {
            Alert.alert('Error', 'No hay un bebé seleccionado');
            return;
        }

        setSaving(true);
        try {
            // Obtener condiciones actuales de la base de datos
            const currentConditions = await MedicalConditionsService.getMedicalConditionsByBaby(baby.id);
            
            // Crear un mapa de condiciones actuales por categoría y nombre
            const currentConditionsMap = new Map();
            currentConditions.forEach(condition => {
                const key = `${condition.medical_category_id}-${condition.condition_name}`;
                currentConditionsMap.set(key, condition);
            });

            // Preparar las condiciones que deben existir según la selección actual
            const desiredConditions = [];
            
            Object.entries(selectedConditions).forEach(([subcategory, conditions]) => {
                const categoryId = getCategoryIdForSubcategory(subcategory);
                if (categoryId) {
                    conditions.forEach(conditionName => {
                        desiredConditions.push({
                            categoryId,
                            conditionName
                        });
                    });
                }
            });

            // Identificar condiciones a agregar
            const conditionsToAdd = desiredConditions.filter(desired => {
                const key = `${desired.categoryId}-${desired.conditionName}`;
                return !currentConditionsMap.has(key);
            });

            // Identificar condiciones a eliminar
            const conditionsToDelete = currentConditions.filter(current => {
                return !desiredConditions.some(desired => 
                    desired.categoryId === current.medical_category_id && 
                    desired.conditionName === current.condition_name
                );
            });

            // Ejecutar operaciones
            const results = [];

            // Agregar nuevas condiciones
            for (const condition of conditionsToAdd) {
                try {
                    const result = await MedicalConditionsService.createMedicalCondition(
                        baby.id,
                        condition.categoryId,
                        condition.conditionName
                    );
                    results.push({ success: true, action: 'added', condition: condition.conditionName });
                } catch (error) {
                    console.error(`Error agregando ${condition.conditionName}:`, error);
                    results.push({ success: false, action: 'added', condition: condition.conditionName, error });
                }
            }

            // Eliminar condiciones no seleccionadas
            for (const condition of conditionsToDelete) {
                try {
                    await MedicalConditionsService.deleteMedicalCondition(condition.id);
                    results.push({ success: true, action: 'deleted', condition: condition.condition_name });
                } catch (error) {
                    console.error(`Error eliminando ${condition.condition_name}:`, error);
                    results.push({ success: false, action: 'deleted', condition: condition.condition_name, error });
                }
            }

            // Mostrar resultado
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            if (successful > 0 && failed === 0) {
                Alert.alert(
                    'Éxito', 
                    `Se guardaron correctamente ${successful} cambio${successful > 1 ? 's' : ''} en las condiciones médicas.`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else if (successful > 0 && failed > 0) {
                Alert.alert('Parcialmente completado', `${successful} cambios guardados, ${failed} fallaron.`);
            } else if (failed > 0) {
                Alert.alert('Error', 'No se pudieron guardar los cambios. Intenta de nuevo.');
            } else {
                Alert.alert('Info', 'No hay cambios que guardar.');
            }

            // Recargar condiciones existentes
            await loadExistingConditions();
            
        } catch (error) {
            console.error('Error guardando condiciones médicas:', error);
            Alert.alert('Error', 'Hubo un problema al guardar las condiciones médicas.');
        } finally {
            setSaving(false);
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

    if (!baby) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Cargando información del bebé...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                    <View className="flex-1 items-center">
                        <Text className="text-xl font-semibold text-black">
                            Perfil de Salud
                        </Text>
                        {baby?.name && (
                            <Text className="text-sm text-gray-500">
                                {baby.name}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={saveMedicalConditions}
                        disabled={saving || !baby?.id}
                        className={`px-4 py-2 rounded-lg ${
                            saving || !baby?.id 
                                ? 'bg-gray-100' 
                                : 'bg-blue-500'
                        }`}
                    >
                        <Text className={`text-sm font-medium ${
                            saving || !baby?.id 
                                ? 'text-gray-400' 
                                : 'text-white'
                        }`}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
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