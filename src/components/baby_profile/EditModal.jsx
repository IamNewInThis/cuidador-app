import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getProfileValueOptions, checkFieldHasOptions } from '../../services/BabyProfileServices';

// Cache global para opciones
const optionsCache = {};

const EditModal = ({
    visible,
    onClose,
    selectedItems,
    profileData,
    onSave
}) => {
    const [editedValues, setEditedValues] = useState({});
    const [loading, setSaving] = useState(false);
    const [fieldOptions, setFieldOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    // Resetear loading cuando el modal se cierre
    useEffect(() => {
        if (!visible) {
            setSaving(false);
            setSaveStatus('');
        }
    }, [visible]);

    useEffect(() => {
        if (visible && profileData) {
            // Inicializar valores editables con los valores actuales
            const initialValues = {};
            const fieldsToLoad = new Set();
            
            profileData.forEach(item => {
                if (selectedItems.has(`${item.categoryName}-${item.id}`)) {
                    initialValues[item.profileKey] = item.value;
                    fieldsToLoad.add(item.profileKey);
                }
            });
            
            setEditedValues(initialValues);
            
            // Solo cargar opciones si hay campos seleccionados
            if (fieldsToLoad.size > 0) {
                loadFieldOptions(Array.from(fieldsToLoad));
            } else {
                setLoadingOptions(false);
                setFieldOptions({});
            }
        } else {
            // Limpiar estado cuando el modal se cierra
            setLoadingOptions(false);
            setFieldOptions({});
            setEditedValues({});
        }
    }, [visible, selectedItems, profileData]);

    const loadFieldOptions = async (fields) => {
        if (fields.length === 0) {
            setLoadingOptions(false);
            return;
        }
        
        setLoadingOptions(true);
        const options = {};
        const fieldsToLoad = [];
        
        // Verificar qué campos ya están en caché
        fields.forEach(fieldKey => {
            if (optionsCache[fieldKey]) {
                console.log(`� Usando opciones en caché para ${fieldKey}`);
                options[fieldKey] = optionsCache[fieldKey];
            } else {
                fieldsToLoad.push(fieldKey);
            }
        });
        
        try {
            if (fieldsToLoad.length > 0) {
                console.log(`�🔄 Cargando opciones para ${fieldsToLoad.length} campos nuevos:`, fieldsToLoad);
                
                // Cargar opciones para campos que no están en caché
                const promises = fieldsToLoad.map(async (fieldKey) => {
                    try {
                        const { hasOptions } = await checkFieldHasOptions(fieldKey);
                        
                        if (hasOptions) {
                            const { data, error } = await getProfileValueOptions(fieldKey, { locale: 'es' });
                            if (!error && data) {
                                options[fieldKey] = data;
                                optionsCache[fieldKey] = data; // Guardar en caché
                                console.log(`✅ Opciones cargadas y guardadas en caché para ${fieldKey}:`, data.length);
                            } else {
                                console.warn(`⚠️ No se pudieron cargar opciones para ${fieldKey}:`, error);
                                options[fieldKey] = [];
                                optionsCache[fieldKey] = [];
                            }
                        } else {
                            console.log(`ℹ️ Campo ${fieldKey} no tiene opciones predefinidas`);
                            options[fieldKey] = [];
                            optionsCache[fieldKey] = [];
                        }
                    } catch (err) {
                        console.error(`❌ Error cargando opciones para ${fieldKey}:`, err);
                        options[fieldKey] = [];
                        optionsCache[fieldKey] = [];
                    }
                });
                
                await Promise.all(promises);
            }
            
            setFieldOptions(options);
            console.log('✅ Todas las opciones disponibles (caché + nuevas)');
        } catch (error) {
            console.error('❌ Error general cargando opciones de campos:', error);
        } finally {
            setLoadingOptions(false);
        }
    };

    const handleValueChange = (key, newValue) => {
        setEditedValues(prev => ({
            ...prev,
            [key]: newValue
        }));
    };

    const getOptionsForKey = (key) => {
        // Obtener opciones dinámicas cargadas desde la base de datos
        return fieldOptions[key] || [];
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('Guardando cambios...');
        
        try {
            const result = await onSave(editedValues);
            
            // Verificar si hubo errores parciales
            if (result && result.error && result.error.length > 0) {
                if (result.data && result.data.length > 0) {
                    // Éxito parcial - resetear loading porque mostraremos alert
                    setSaving(false);
                    setSaveStatus('');
                    Alert.alert(
                        'Guardado parcial',
                        `Se guardaron ${result.data.length} de ${result.summary.totalFields} campos. Algunos campos tuvieron errores.`,
                        [{ text: 'OK' }]
                    );
                } else {
                    // Error completo - resetear loading porque mostraremos alert
                    setSaving(false);
                    setSaveStatus('');
                    Alert.alert(
                        'Error',
                        'No se pudieron guardar los cambios. Inténtalo de nuevo.',
                        [{ text: 'OK' }]
                    );
                }
            } else {
                // Éxito completo - mostrar estado final antes de cerrar
                setSaveStatus('✅ Guardado exitosamente');
                console.log('✅ Modal: Guardado exitoso completado, cerrando modal en 500ms');
                
                // Pequeña pausa para mostrar el éxito antes de cerrar
                setTimeout(() => {
                    setSaving(false);
                    setSaveStatus('');
                }, 500);
            }
        } catch (error) {
            setSaving(false);
            setSaveStatus('');
            Alert.alert(
                'Error',
                'No se pudieron guardar los cambios. Inténtalo de nuevo.',
                [{ text: 'OK' }]
            );
        }
    };

    const getSelectedItemsData = () => {
        if (!profileData) return [];
        
        return profileData.filter(item => 
            selectedItems.has(`${item.categoryName}-${item.id}`)
        );
    };

    const selectedItemsData = getSelectedItemsData();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView className="flex-1 bg-gray-50">
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    {/* Header */}
                    <View className="bg-white border-b border-gray-200 px-5 py-4">
                        <View className="flex-row items-center justify-between">
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            >
                                <Feather name="x" size={20} color="#374151" />
                            </TouchableOpacity>
                            
                            <Text className="text-xl font-semibold text-black">
                                Editar Perfil
                            </Text>
                            
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={loading}
                                className={`px-4 py-2 rounded-lg ${
                                    loading ? 'bg-gray-300' : 'bg-blue-500'
                                }`}
                            >
                                {loading && saveStatus === '✅ Guardado exitosamente' ? (
                                    <View className="flex-row items-center">
                                        <Text className="text-white font-medium mr-2">
                                            ✅ Guardado
                                        </Text>
                                    </View>
                                ) : (
                                    <Text className="text-white font-medium">
                                        {loading ? saveStatus || 'Guardando...' : 'Guardar'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView className="flex-1 px-5 py-6">
                        <Text className="text-lg font-semibold text-gray-800 mb-4">
                            Elementos seleccionados ({selectedItemsData.length})
                        </Text>

                        {loadingOptions ? (
                            <View className="bg-white rounded-xl p-4 items-center">
                                <View className="flex-row items-center">
                                    <Feather name="loader" size={20} color="#3B82F6" />
                                    <Text className="text-gray-600 text-sm ml-2">
                                        Cargando opciones...
                                    </Text>
                                </View>
                            </View>
                        ) : selectedItemsData.length === 0 ? (
                            <View className="bg-white rounded-xl p-6 items-center">
                                <Feather name="info" size={48} color="#9CA3AF" />
                                <Text className="text-gray-500 text-center mt-4">
                                    No hay elementos seleccionados para editar
                                </Text>
                            </View>
                        ) : (
                            <View className="space-y-4">
                                {selectedItemsData.map((item, index) => {
                                    const options = getOptionsForKey(item.profileKey);
                                    const currentValue = editedValues[item.profileKey] || item.value;
                                    
                                    return (
                                        <View key={`${item.profileKey}-${index}`} className="bg-white rounded-xl p-4">
                                            <Text className="text-lg font-medium text-gray-800 mb-3">
                                                {item.label}
                                            </Text>
                                            
                                            <Text className="text-sm text-gray-600 mb-3">
                                                Valor actual: {item.value}
                                            </Text>
                                            
                                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                                Selecciona nuevo valor:
                                            </Text>
                                            
                                            <View className="space-y-2">
                                                {options.length === 0 ? (
                                                    <View className="flex-row items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <Feather name="alert-triangle" size={16} color="#F59E0B" />
                                                        <Text className="text-yellow-700 text-sm ml-2 flex-1">
                                                            No hay opciones predefinidas para este campo en la base de datos.
                                                        </Text>
                                                    </View>
                                                ) : options.map((option) => {
                                                    const isSelected = currentValue === option.value || 
                                                                     currentValue === option.label;
                                                    
                                                    return (
                                                        <TouchableOpacity
                                                            key={option.value}
                                                            onPress={() => handleValueChange(item.profileKey, option.label)}
                                                            className={`flex-row items-center p-3 rounded-lg border ${
                                                                isSelected 
                                                                    ? 'bg-blue-50 border-blue-500' 
                                                                    : 'bg-gray-50 border-gray-200'
                                                            }`}
                                                        >
                                                            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                                                                isSelected 
                                                                    ? 'bg-blue-500 border-blue-500' 
                                                                    : 'border-gray-300'
                                                            }`}>
                                                                {isSelected && (
                                                                    <Feather name="check" size={12} color="white" />
                                                                )}
                                                            </View>
                                                            <Text className={`flex-1 ${
                                                                isSelected 
                                                                    ? 'text-blue-700 font-medium' 
                                                                    : 'text-gray-700'
                                                            }`}>
                                                                {option.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

export default EditModal;