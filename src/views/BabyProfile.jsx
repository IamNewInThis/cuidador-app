import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react'
import { Feather } from '@expo/vector-icons';

const BabyProfile = ({ navigation }) => {
    const [selectedSections, setSelectedSections] = useState(new Set());
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const handleGoBack = () => {
        // Volver a Chat con el parámetro para abrir el SideMenu
        navigation.navigate('Chat', { openSideMenu: true });
    };

    const handleExport = () => {
        if (selectedSections.size > 0 || selectedItems.size > 0) {
            // Aquí irá la lógica de exportación a PDF
            console.log('Exportar selecciones:', { selectedSections, selectedItems });
            // Por ahora mostrar alerta o acción temporal
        } else {
            // Seleccionar todo automáticamente
            setIsSelectionMode(true);
            setSelectedSections(new Set(['sleep', 'emotions', 'care', 'development']));
            setSelectedItems(new Set([
                'sleep-1', 'sleep-2', 'sleep-3', 'sleep-4', 'sleep-5',
                'emotions-1', 'emotions-2', 'emotions-3', 'emotions-4',
                'care-1', 'care-2', 'care-3', 'care-4', 'care-5',
                'development-1', 'development-2', 'development-3'
            ]));
        }
    };

    const handleEdit = () => {
        // Aquí irá la lógica de edición
        console.log('Editar selecciones:', { selectedSections, selectedItems });
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedSections(new Set());
        setSelectedItems(new Set());
    };

    const getTotalSelectedCount = () => {
        return selectedSections.size + selectedItems.size;
    };

    const handleSelectSection = (sectionId) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
        }
        
        const newSelectedSections = new Set(selectedSections);
        const newSelectedItems = new Set(selectedItems);
        
        // Definir los items de cada sección
        const sectionItems = {
            'sleep': ['sleep-1', 'sleep-2', 'sleep-3', 'sleep-4', 'sleep-5'],
            'emotions': ['emotions-1', 'emotions-2', 'emotions-3', 'emotions-4'],
            'care': ['care-1', 'care-2', 'care-3', 'care-4', 'care-5'],
            'development': ['development-1', 'development-2', 'development-3']
        };
        
        if (newSelectedSections.has(sectionId)) {
            // Deseleccionar sección y todos sus items
            newSelectedSections.delete(sectionId);
            sectionItems[sectionId].forEach(itemId => {
                newSelectedItems.delete(itemId);
            });
        } else {
            // Seleccionar sección y todos sus items
            newSelectedSections.add(sectionId);
            sectionItems[sectionId].forEach(itemId => {
                newSelectedItems.add(itemId);
            });
        }
        
        setSelectedSections(newSelectedSections);
        setSelectedItems(newSelectedItems);
    };

    const handleSelectItem = (itemId) => {
        if (!isSelectionMode) {
            setIsSelectionMode(true);
        }
        
        const newSelectedItems = new Set(selectedItems);
        const newSelectedSections = new Set(selectedSections);
        
        // Definir los items de cada sección
        const sectionItems = {
            'sleep': ['sleep-1', 'sleep-2', 'sleep-3', 'sleep-4', 'sleep-5'],
            'emotions': ['emotions-1', 'emotions-2', 'emotions-3', 'emotions-4'],
            'care': ['care-1', 'care-2', 'care-3', 'care-4', 'care-5'],
            'development': ['development-1', 'development-2', 'development-3']
        };
        
        // Encontrar a qué sección pertenece este item
        let currentSection = null;
        for (const [section, items] of Object.entries(sectionItems)) {
            if (items.includes(itemId)) {
                currentSection = section;
                break;
            }
        }
        
        if (newSelectedItems.has(itemId)) {
            // Deseleccionar item
            newSelectedItems.delete(itemId);
            // Si la sección estaba seleccionada, deseleccionarla también
            if (currentSection && newSelectedSections.has(currentSection)) {
                newSelectedSections.delete(currentSection);
            }
        } else {
            // Seleccionar item
            newSelectedItems.add(itemId);
            
            // Verificar si todos los items de la sección están seleccionados
            if (currentSection) {
                const allItemsSelected = sectionItems[currentSection].every(item => 
                    newSelectedItems.has(item)
                );
                if (allItemsSelected) {
                    newSelectedSections.add(currentSection);
                }
            }
        }
        
        setSelectedItems(newSelectedItems);
        setSelectedSections(newSelectedSections);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200">
                <View className="flex-row items-center justify-between px-5 py-4">
                    {isSelectionMode ? (
                        <>
                            {/* Modo selección */}
                            <TouchableOpacity
                                onPress={handleCancelSelection}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="x" size={20} color="#374151" />
                            </TouchableOpacity>
                            <Text className="text-lg font-semibold text-black">
                                {getTotalSelectedCount()} elemento{getTotalSelectedCount() !== 1 ? 's' : ''}
                            </Text>
                            <View className="flex-row items-center space-x-3">
                                <TouchableOpacity
                                    onPress={handleEdit}
                                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Feather name="edit-3" size={18} color="#6B7280" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleExport}
                                    className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Feather name="download" size={18} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* Modo normal */}
                            <TouchableOpacity
                                onPress={handleGoBack}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="menu" size={24} color="#374151" />
                            </TouchableOpacity>
                            <Text className="text-xl font-semibold text-black">
                                Perfil de Jacinta
                            </Text>
                            <TouchableOpacity
                                onPress={handleExport}
                                className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="check-square" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
                {/* Avatar y nombre del bebé */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
                        <Text className="text-3xl">👶</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-800 mb-1">Jacinta</Text>
                    <Text className="text-lg text-gray-600">5 Meses</Text>
                </View>

                {/* Sección: Sueño y descanso */}
                <TouchableOpacity 
                    onPress={() => handleSelectSection('sleep')}
                    activeOpacity={0.7}
                >
                    <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                        selectedSections.has('sleep') ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
                    }`}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                {isSelectionMode && (
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                        selectedSections.has('sleep') 
                                            ? 'bg-blue-500 border-blue-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSections.has('sleep') && (
                                            <Feather name="check" size={14} color="white" />
                                        )}
                                    </View>
                                )}
                                <Text className="text-xl font-bold text-gray-800">Sueño y descanso</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            <TouchableOpacity 
                                onPress={() => handleSelectItem('sleep-1')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('sleep-1') ? 'bg-blue-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('sleep-1') 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('sleep-1') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Rutina nocturna:</Text>
                                        <Text className="text-gray-600 mt-1">Baño 20:00 + última toma de leche durante la noche acompañada</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('sleep-2')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('sleep-2') ? 'bg-blue-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('sleep-2') 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('sleep-2') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Horario de siestas:</Text>
                                        <Text className="text-gray-600 mt-1">2</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('sleep-3')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('sleep-3') ? 'bg-blue-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('sleep-3') 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('sleep-3') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Hora de siestas:</Text>
                                        <Text className="text-gray-600 mt-1">12:00 - 13:00 y 16:00 - 17:00</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('sleep-4')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('sleep-4') ? 'bg-blue-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('sleep-4') 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('sleep-4') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Despertares nocturnos:</Text>
                                        <Text className="text-gray-600 mt-1">Ocasionales 1 por semana</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('sleep-5')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('sleep-5') ? 'bg-blue-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('sleep-5') 
                                                ? 'bg-blue-500 border-blue-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('sleep-5') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Objeto de apego:</Text>
                                        <Text className="text-gray-600 mt-1">Manta</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sección: Emociones y crianza */}
                <TouchableOpacity 
                    onPress={() => handleSelectSection('emotions')}
                    activeOpacity={0.7}
                >
                    <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                        selectedSections.has('emotions') ? 'border-green-500 bg-green-50' : 'border-gray-100'
                    }`}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                {isSelectionMode && (
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                        selectedSections.has('emotions') 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSections.has('emotions') && (
                                            <Feather name="check" size={14} color="white" />
                                        )}
                                    </View>
                                )}
                                <Text className="text-xl font-bold text-gray-800">Emociones y crianza</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            <TouchableOpacity 
                                onPress={() => handleSelectItem('emotions-1')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('emotions-1') ? 'bg-green-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('emotions-1') 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('emotions-1') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Temperamento:</Text>
                                        <Text className="text-gray-600 mt-1">Tranquila y curiosa</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('emotions-2')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('emotions-2') ? 'bg-green-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('emotions-2') 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('emotions-2') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Actividades favoritas:</Text>
                                        <Text className="text-gray-600 mt-1">Jugar con sonajeros, escuchar música</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('emotions-3')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('emotions-3') ? 'bg-green-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('emotions-3') 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('emotions-3') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Señales de cansancio:</Text>
                                        <Text className="text-gray-600 mt-1">Se frota los ojos, bosteza</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('emotions-4')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('emotions-4') ? 'bg-green-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('emotions-4') 
                                                ? 'bg-green-500 border-green-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('emotions-4') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Cómo se calma:</Text>
                                        <Text className="text-gray-600 mt-1">Con música suave y caricias</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sección: Cuidados diarios */}
                <TouchableOpacity 
                    onPress={() => handleSelectSection('care')}
                    activeOpacity={0.7}
                >
                    <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                        selectedSections.has('care') ? 'border-purple-500 bg-purple-50' : 'border-gray-100'
                    }`}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                {isSelectionMode && (
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                        selectedSections.has('care') 
                                            ? 'bg-purple-500 border-purple-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSections.has('care') && (
                                            <Feather name="check" size={14} color="white" />
                                        )}
                                    </View>
                                )}
                                <Text className="text-xl font-bold text-gray-800">Cuidados diarios</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            <TouchableOpacity 
                                onPress={() => handleSelectItem('care-1')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('care-1') ? 'bg-purple-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('care-1') 
                                                ? 'bg-purple-500 border-purple-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('care-1') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Alimentación:</Text>
                                        <Text className="text-gray-600 mt-1">Lactancia materna cada 3 horas</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('care-2')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('care-2') ? 'bg-purple-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('care-2') 
                                                ? 'bg-purple-500 border-purple-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('care-2') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Cambio de pañal:</Text>
                                        <Text className="text-gray-600 mt-1">Cada 2-3 horas o cuando sea necesario</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('care-3')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('care-3') ? 'bg-purple-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('care-3') 
                                                ? 'bg-purple-500 border-purple-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('care-3') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Baño:</Text>
                                        <Text className="text-gray-600 mt-1">Diario a las 20:00</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('care-4')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('care-4') ? 'bg-purple-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('care-4') 
                                                ? 'bg-purple-500 border-purple-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('care-4') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Medicamentos:</Text>
                                        <Text className="text-gray-600 mt-1">Vitamina D diaria (2 gotas)</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('care-5')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('care-5') ? 'bg-purple-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('care-5') 
                                                ? 'bg-purple-500 border-purple-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('care-5') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Estimulación:</Text>
                                        <Text className="text-gray-600 mt-1">Tiempo boca abajo 15 min, 3 veces al día</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sección: Desarrollo */}
                <TouchableOpacity 
                    onPress={() => handleSelectSection('development')}
                    activeOpacity={0.7}
                >
                    <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                        selectedSections.has('development') ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                    }`}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                {isSelectionMode && (
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                        selectedSections.has('development') 
                                            ? 'bg-orange-500 border-orange-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSections.has('development') && (
                                            <Feather name="check" size={14} color="white" />
                                        )}
                                    </View>
                                )}
                                <Text className="text-xl font-bold text-gray-800">Desarrollo</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            <TouchableOpacity 
                                onPress={() => handleSelectItem('development-1')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('development-1') ? 'bg-orange-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('development-1') 
                                                ? 'bg-orange-500 border-orange-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('development-1') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Habilidades motoras:</Text>
                                        <Text className="text-gray-600 mt-1">Sostiene la cabeza, rueda de boca arriba a lado</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('development-2')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('development-2') ? 'bg-orange-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('development-2') 
                                                ? 'bg-orange-500 border-orange-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('development-2') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Comunicación:</Text>
                                        <Text className="text-gray-600 mt-1">Balbucea, sonríe socialmente</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => handleSelectItem('development-3')}
                                activeOpacity={0.7}
                            >
                                <View className={`flex-row items-start p-2 rounded-lg ${
                                    selectedItems.has('development-3') ? 'bg-orange-100' : ''
                                }`}>
                                    {isSelectionMode && (
                                        <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                            selectedItems.has('development-3') 
                                                ? 'bg-orange-500 border-orange-500' 
                                                : 'border-gray-300'
                                        }`}>
                                            {selectedItems.has('development-3') && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                    )}
                                    <View className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-gray-700 font-medium">Juguetes favoritos:</Text>
                                        <Text className="text-gray-600 mt-1">Sonajeros coloridos, móvil musical</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

export default BabyProfile