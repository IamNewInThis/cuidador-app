import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react'
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getBabies } from '../services/BabiesService';
import { getProfileBaby, getProfileByCategory } from '../services/BabyProfileServices';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

const BabyProfile = ({ navigation }) => {
    const [selectedSections, setSelectedSections] = useState(new Set());
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const route = useRoute();
    const { user } = useAuth();
    const { t } = useTranslation();
    const { i18n } = useTranslation();
    const [baby, setBaby] = useState(null);
    const [loadingBaby, setLoadingBaby] = useState(true);
    const [profileEntries, setProfileEntries] = useState([]);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileByCategory, setProfileByCategory] = useState({});
    const [sleepProfileData, setSleepProfileData] = useState([]);
    const [emotionsProfileData, setEmotionsProfileData] = useState([]);
    const [careProfileData, setCareProfileData] = useState([]);
    const [familyProfileData, setFamilyProfileData] = useState([]);
    const [autonomyProfileData, setAutonomyProfileData] = useState([]);

    const handleGoBack = () => {
        // Volver a Chat con el parámetro para abrir el SideMenu
        navigation.navigate('Chat', { openSideMenu: true });
    };

    const formatBabyAge = (birthdate) => {
        if (!birthdate) return '';

        const parsedDate = new Date(birthdate);
        if (Number.isNaN(parsedDate.getTime())) {
            return '';
        }

        const now = new Date();
        let years = now.getFullYear() - parsedDate.getFullYear();
        let months = now.getMonth() - parsedDate.getMonth();

        if (now.getDate() < parsedDate.getDate()) {
            months -= 1;
        }

        if (months < 0) {
            years -= 1;
            months += 12;
        }

        years = Math.max(years, 0);
        months = Math.max(months, 0);

        if (years > 0 && months > 0) {
            return `${years} año${years !== 1 ? 's' : ''} ${months} mes${months !== 1 ? 'es' : ''}`;
        } else if (years > 0) {
            return `${years} año${years !== 1 ? 's' : ''}`;
        } else if (months > 0) {
            return `${months} mes${months !== 1 ? 'es' : ''}`;
        } else {
            return 'Recién nacido';
        }
    };

    // Cargar bebé seleccionado: prioriza params -> AsyncStorage -> buscar por ID
    useEffect(() => {
        let mounted = true;

        const loadBaby = async () => {
            try {
                setLoadingBaby(true);

                // 1) Si viene el objeto baby por params
                const paramBaby = route.params?.baby;
                const paramBabyId = route.params?.babyId;

                if (paramBaby) {
                    if (mounted) setBaby(paramBaby);
                    // guardar en AsyncStorage para próxima vez
                    await AsyncStorage.setItem('selectedBaby', JSON.stringify(paramBaby));
                    if (user?.id) await AsyncStorage.setItem(`selectedBaby_${user.id}`, paramBaby.id);
                    return;
                }

                // 2) Si viene solo babyId, buscar en supabase
                if (paramBabyId && user?.id) {
                    try {
                        const { data } = await getBabies(user.id);
                        const found = data.find(b => b.id === paramBabyId);
                        if (found) {
                            if (mounted) setBaby(found);
                            await AsyncStorage.setItem('selectedBaby', JSON.stringify(found));
                            await AsyncStorage.setItem(`selectedBaby_${user.id}`, found.id);
                            return;
                        }
                    } catch (err) {
                        console.error('Error fetching babies by user to resolve babyId:', err);
                    }
                }

                // 3) Intentar cargar desde AsyncStorage (user-specific key primero)
                if (user?.id) {
                    const storedId = await AsyncStorage.getItem(`selectedBaby_${user.id}`);
                    if (storedId) {
                        // storedId puede ser id; intentar buscar completo
                        try {
                            const { data } = await getBabies(user.id);
                            const found = data.find(b => b.id === storedId || JSON.stringify(b) === storedId);
                            if (found) {
                                if (mounted) setBaby(found);
                                await AsyncStorage.setItem('selectedBaby', JSON.stringify(found));
                                return;
                            }
                        } catch (err) {
                            console.error('Error fetching babies for stored id:', err);
                        }
                    }
                }

                const stored = await AsyncStorage.getItem('selectedBaby');
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (mounted) setBaby(parsed);
                    } catch (err) {
                        // si stored es solo id string
                        if (user?.id) {
                            try {
                                const { data } = await getBabies(user.id);
                                const found = data.find(b => b.id === stored);
                                if (found && mounted) setBaby(found);
                            } catch (err2) {
                                console.error('Error resolving stored baby id:', err2);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error loading selected baby in BabyProfile:', err);
            } finally {
                if (mounted) setLoadingBaby(false);
            }
        };

        loadBaby();

        return () => { mounted = false };
    }, [route.params, user?.id]);

    // Cargar entradas de baby_profile cuando tengamos el baby
    useEffect(() => {
        let mounted = true;
        const loadProfile = async () => {
            if (!baby?.id) return;
            setProfileLoading(true);
            try {
                const locale = i18n?.language || 'es';
                
                // 1. Obtener todos los datos para encontrar el category_id de Sleep
                const { data: allData, error: allError } = await getProfileBaby(baby.id, { locale });
                if (allError) {
                    console.error('Error loading baby_profile:', allError);
                    setProfileEntries([]);
                    setProfileByCategory({});
                    setSleepProfileData([]);
                    return;
                }

                if (!mounted) return;
                setProfileEntries(allData || []);

                // Agrupar por category_id
                const grouped = (allData || []).reduce((acc, item) => {
                    const cat = item.category_id || 'general';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                }, {});
                setProfileByCategory(grouped);

                // Definir las categorías y sus criterios de búsqueda
                const categories = [
                    {
                        name: 'sleep',
                        keywords: ['sleep', 'sueño', 'descanso'],
                        setter: setSleepProfileData,
                        emoji: '💤'
                    },
                    {
                        name: 'emotions',
                        keywords: ['emotion', 'emocion', 'crianza', 'parenting'],
                        setter: setEmotionsProfileData,
                        emoji: '😊'
                    },
                    {
                        name: 'care',
                        keywords: ['care', 'cuidado', 'daily', 'diario'],
                        setter: setCareProfileData,
                        emoji: '🍼'
                    },
                    {
                        name: 'autonomy',
                        keywords: ['development', 'desarrollo', 'motor', 'milestone', 'autonomy', 'autonomia'],
                        setter: setAutonomyProfileData,
                        emoji: '🎯'
                    },
                    {
                        name: 'family',
                        keywords: ['family', 'familia', 'environment', 'ambiente', 'context', 'contexto'],
                        setter: setFamilyProfileData,
                        emoji: '👨‍👩‍👧‍👦'
                    }
                ];

                // Función auxiliar para cargar datos de una categoría
                const loadCategoryData = async (category, categoryItem) => {
                    if (!categoryItem || !mounted) return;

                    const categoryId = categoryItem.category_id;
                    const { data, error } = await getProfileByCategory(
                        baby.id,
                        categoryId,
                        { locale }
                    );

                    if (!error && mounted) {
                        category.setter(data || []);
                        console.log(`${category.emoji} Datos de ${category.name} cargados:`, data?.length || 0, 'entradas');
                        if (data?.length > 0) {
                            console.log(`${category.emoji} Detalle:`, data.map(d => ({ key: d.key, value: d.value })));
                        }
                    } else if (error) {
                        console.error(`Error loading ${category.name} profile:`, error);
                        category.setter([]);
                    }
                };

                // Procesar cada categoría
                for (const category of categories) {
                    const categoryItem = (allData || []).find(item => {
                        const categoryName = item.category_name?.toLowerCase() || '';
                        return category.keywords.some(keyword => categoryName.includes(keyword));
                    });

                    if (!categoryItem) {
                        console.log(`⚠️ No se encontró la categoría de ${category.name}`);
                        category.setter([]);
                        continue;
                    }

                    await loadCategoryData(category, categoryItem);
                }
            } catch (err) {
                console.error('Unexpected error loading baby_profile:', err);
                setProfileEntries([]);
                setProfileByCategory({});
            } finally {
                if (mounted) setProfileLoading(false);
            }
        };

        loadProfile();
        return () => { mounted = false };
    }, [baby?.id, i18n?.language]);

    const handleExport = () => {
        if (selectedSections.size > 0 || selectedItems.size > 0) {
            // Aquí irá la lógica de exportación a PDF
            console.log('Exportar selecciones:', { selectedSections, selectedItems });
            // Por ahora mostrar alerta o acción temporal
        } else {
            // Seleccionar todo automáticamente
            setIsSelectionMode(true);
            
            // Obtener todos los IDs dinámicamente (solo elementos con valores)
            const allSleepItems = sleepItemsWithValues.map(item => item.id);
            const allEmotionItems = emotionsItemsWithValues.map(item => item.id);
            const allCareItems = careItemsWithValues.map(item => item.id);
            const allAutonomyItems = autonomyItemsWithValues.map(item => item.id);
            const allHealthItems = ['health-1', 'health-2', 'health-3'];

            setSelectedSections(new Set(['sleep', 'emotions', 'care', 'autonomy', 'health']));
            setSelectedItems(new Set([
                ...allSleepItems,
                ...allEmotionItems,
                ...allCareItems,
                ...allAutonomyItems,
                ...allHealthItems
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
        
        // Definir los items de cada sección dinámicamente
        const getSectionItems = (section) => {
            switch(section) {
                case 'sleep':
                    return sleepItemsWithValues.map(item => item.id);
                case 'emotions':
                    return emotionsItemsWithValues.map(item => item.id);
                case 'care':
                    return careItemsWithValues.map(item => item.id);
                case 'autonomy':
                    return autonomyItemsWithValues.map(item => item.id);
                case 'family':
                    return familyItemsWithValues.map(item => item.id);
                case 'health':
                    return ['health-1', 'health-2', 'health-3'];
                default:
                    return [];
            }
        };
        
        const sectionItems = getSectionItems(sectionId);
        
        if (newSelectedSections.has(sectionId)) {
            // Deseleccionar sección y todos sus items
            newSelectedSections.delete(sectionId);
            sectionItems.forEach(itemId => {
                newSelectedItems.delete(itemId);
            });
        } else {
            // Seleccionar sección y todos sus items
            newSelectedSections.add(sectionId);
            sectionItems.forEach(itemId => {
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
        
        // Función para obtener items de cada sección dinámicamente
        const getSectionItems = (section) => {
            switch(section) {
                case 'sleep':
                    return sleepItemsWithValues.map(item => item.id);
                case 'emotions':
                    return emotionsItemsWithValues.map(item => item.id);
                case 'care':
                    return careItemsWithValues.map(item => item.id);
                case 'autonomy':
                    return autonomyItemsWithValues.map(item => item.id);
                case 'health':
                    return ['health-1', 'health-2', 'health-3'];
                default:
                    return [];
            }
        };
        
        // Encontrar a qué sección pertenece este item
        let currentSection = null;
        const sections = ['sleep', 'emotions', 'care', 'development', 'health'];
        
        for (const section of sections) {
            const sectionItems = getSectionItems(section);
            if (sectionItems.includes(itemId)) {
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
                const sectionItems = getSectionItems(currentSection);
                const allItemsSelected = sectionItems.every(item => 
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

    // Filtrar elementos de sueño que tienen valores reales en la BD
    // Ahora usa directamente sleepProfileData en lugar de buscar por keys individuales
    const sleepItemsWithValues = sleepProfileData.map((item, index) => ({
        id: `sleep-${index + 1}`,
        label: item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formatear key como label
        profileKey: item.key,
        value: item.value,
        categoryName: item.category_name
    }));

    // Filtrar elementos de cuidados que tienen valores reales en la BD
    const careItemsWithValues = careProfileData.map((item, index) => ({
        id: `care-${index + 1}`,
        label: item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        profileKey: item.key,
        value: item.value,
        categoryName: item.category_name
    }));

    // Filtrar elementos de autonomía que tienen valores reales en la BD
    const autonomyItemsWithValues = autonomyProfileData.map((item, index) => ({
        id: `autonomy-${index + 1}`,
        label: item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        profileKey: item.key,
        value: item.value,
        categoryName: item.category_name
    }));

    // Filtrar elementos de emociones que tienen valores reales en la BD
    const emotionsItemsWithValues = emotionsProfileData.map((item, index) => ({
        id: `emotions-${index + 1}`,
        label: item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        profileKey: item.key,
        value: item.value,
        categoryName: item.category_name
    }));

    // Filtrar elementos de familia que tienen valores reales en la BD
    const familyItemsWithValues = familyProfileData.map((item, index) => ({
        id: `family-${index + 1}`,
        label: item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        profileKey: item.key,
        value: item.value,
        categoryName: item.category_name
    }));

    // Debug: mostrar datos de sueño cuando cambien
    useEffect(() => {
        if (sleepItemsWithValues.length > 0) {
            console.log('🛏️ sleepItemsWithValues actualizado:', sleepItemsWithValues.length, 'items');
            console.log('📋 Items:', sleepItemsWithValues.map(i => `${i.label}: ${i.value}`));
        }
    }, [sleepProfileData.length]);

    if (loadingBaby) {
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
                                Perfil de {baby?.name || 'Sin nombre'}
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
                    <Text className="text-2xl font-bold text-gray-800 mb-1">{baby?.name || 'Sin nombre'}</Text>
                    <Text className="text-lg text-gray-600">{baby?.birthdate ? formatBabyAge(baby.birthdate) : ''}</Text>
                </View>

                {/* Sección: Salud y bienestar */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('HealthProfileView')}
                    activeOpacity={0.7}
                    className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-100"
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3">
                                <Feather name="heart" size={16} color="#EF4444" />
                            </View>
                            <Text className="text-xl font-bold text-gray-800">Salud y bienestar</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#9CA3AF" />
                    </View>
                    
                    <View className="space-y-3">
                        {/* Alergias */}
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                            <View className="flex-1">
                                <Text className="text-gray-700 font-medium">Alergias:</Text>
                                <View className="flex-row flex-wrap mt-1">
                                    <View className="bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mr-1 mb-1">
                                        <Text className="text-red-700 text-xs">Huevo</Text>
                                    </View>
                                    <View className="bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mr-1 mb-1">
                                        <Text className="text-red-700 text-xs">Polen</Text>
                                    </View>
                                    <View className="bg-gray-100 rounded-full px-2 py-0.5">
                                        <Text className="text-gray-600 text-xs">+2 más</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Condiciones médicas */}
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                            <View className="flex-1">
                                <Text className="text-gray-700 font-medium">Condiciones médicas:</Text>
                                <View className="flex-row flex-wrap mt-1">
                                    <View className="bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 mr-1 mb-1">
                                        <Text className="text-orange-700 text-xs">Asma leve</Text>
                                    </View>
                                    <View className="bg-gray-100 rounded-full px-2 py-0.5">
                                        <Text className="text-gray-600 text-xs">+1 más</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Estado general */}
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                            <View className="flex-1">
                                <Text className="text-gray-600 mt-1">Última revisión: 15 Oct 2025</Text>
                            </View>
                        </View>

                        {/* Indicador de navegación */}
                        <View className="mt-3 pt-3 border-t border-gray-100">
                            <Text className="text-blue-600 text-sm font-medium">Toca para ver detalles completos</Text>
                        </View>
                    </View>
                </TouchableOpacity>


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
                                <Text className="text-xl font-bold text-gray-800">{t('babyProfileSleep.title')}</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            {sleepItemsWithValues.length > 0 ? (
                                sleepItemsWithValues.map((item, index) => (
                                    <TouchableOpacity 
                                        key={item.id}
                                        onPress={() => handleSelectItem(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View className={`flex-row items-start p-2 rounded-lg ${
                                            selectedItems.has(item.id) ? 'bg-blue-100' : ''
                                        }`}>
                                            {isSelectionMode && (
                                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                                    selectedItems.has(item.id) 
                                                        ? 'bg-blue-500 border-blue-500' 
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedItems.has(item.id) && (
                                                        <Feather name="check" size={12} color="white" />
                                                    )}
                                                </View>
                                            )}
                                            <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-medium">{item.label}:</Text>
                                                <Text className="text-gray-600 mt-1">
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-row items-center p-4 bg-gray-50 rounded-lg">
                                    <Feather name="info" size={16} color="#6B7280" />
                                    <Text className="text-gray-500 text-sm flex-1 ml-2">
                                        {t('babyProfileSleep.noSleepData', { babyName: baby?.name || 'este bebé' })} 
                                        {t('babyProfileSleep.noSleepDataDesc')}
                                    </Text>
                                </View>
                            )}
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
                            {careItemsWithValues.length > 0 ? (
                                careItemsWithValues.map((item, index) => (
                                    <TouchableOpacity 
                                        key={item.id}
                                        onPress={() => handleSelectItem(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View className={`flex-row items-start p-2 rounded-lg ${
                                            selectedItems.has(item.id) ? 'bg-purple-100' : ''
                                        }`}>
                                            {isSelectionMode && (
                                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                                    selectedItems.has(item.id) 
                                                        ? 'bg-purple-500 border-purple-500' 
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedItems.has(item.id) && (
                                                        <Feather name="check" size={12} color="white" />
                                                    )}
                                                </View>
                                            )}
                                            <View className="w-2 h-2 rounded-full bg-purple-500 mt-2 mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-medium">{item.label}:</Text>
                                                <Text className="text-gray-600 mt-1">
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-row items-center p-4 bg-gray-50 rounded-lg">
                                    <Feather name="info" size={16} color="#6B7280" />
                                    <Text className="text-gray-500 text-sm flex-1 ml-2">
                                        No hay datos de cuidados diarios para {baby?.name || 'este bebé'}. 
                                        {' '}Los datos se agregarán automáticamente cuando hables con Lumi sobre alimentación, 
                                        rutinas y cuidados de tu bebé.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sección: Autonomía y desarrollo integral */}
                <TouchableOpacity 
                    onPress={() => handleSelectSection('autonomy')}
                    activeOpacity={0.7}
                >
                    <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                        selectedSections.has('autonomy') ? 'border-blue-500 bg-blue-50' : 'border-gray-100'
                    }`}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                {isSelectionMode && (
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                        selectedSections.has('autonomy') 
                                            ? 'bg-blue-500 border-blue-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSections.has('autonomy') && (
                                            <Feather name="check" size={14} color="white" />
                                        )}
                                    </View>
                                )}
                                <Text className="text-xl font-bold text-gray-800">Autonomía y desarrollo integral</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            {autonomyItemsWithValues.length > 0 ? (
                                autonomyItemsWithValues.map((item, index) => (
                                    <TouchableOpacity 
                                        key={item.id}
                                        onPress={() => handleSelectItem(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View className={`flex-row items-start p-2 rounded-lg ${
                                            selectedItems.has(item.id) ? 'bg-blue-100' : ''
                                        }`}>
                                            {isSelectionMode && (
                                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                                    selectedItems.has(item.id) 
                                                        ? 'bg-blue-500 border-blue-500' 
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedItems.has(item.id) && (
                                                        <Feather name="check" size={12} color="white" />
                                                    )}
                                                </View>
                                            )}
                                            <View className="w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-medium">{item.label}:</Text>
                                                <Text className="text-gray-600 mt-1">
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-row items-center p-4 bg-gray-50 rounded-lg">
                                    <Feather name="info" size={16} color="#6B7280" />
                                    <Text className="text-gray-500 text-sm flex-1 ml-2">
                                        No hay datos de autonomía para {baby?.name || 'este bebé'}. 
                                        {' '}Los datos se agregarán automáticamente cuando hables con Lumi sobre el desarrollo 
                                        y la autonomía de tu bebé.
                                    </Text>
                                </View>
                            )}
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
                            {emotionsItemsWithValues.length > 0 ? (
                                emotionsItemsWithValues.map((item, index) => (
                                    <TouchableOpacity 
                                        key={item.id}
                                        onPress={() => handleSelectItem(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View className={`flex-row items-start p-2 rounded-lg ${
                                            selectedItems.has(item.id) ? 'bg-green-100' : ''
                                        }`}>
                                            {isSelectionMode && (
                                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                                    selectedItems.has(item.id) 
                                                        ? 'bg-green-500 border-green-500' 
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedItems.has(item.id) && (
                                                        <Feather name="check" size={12} color="white" />
                                                    )}
                                                </View>
                                            )}
                                            <View className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-medium">{item.label}:</Text>
                                                <Text className="text-gray-600 mt-1">
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-row items-center p-4 bg-gray-50 rounded-lg">
                                    <Feather name="info" size={16} color="#6B7280" />
                                    <Text className="text-gray-500 text-sm flex-1 ml-2">
                                        No hay datos de emociones y crianza para {baby?.name || 'este bebé'}. 
                                        {' '}Los datos se agregarán automáticamente cuando hables con Lumi sobre el temperamento, 
                                        actividades favoritas y señales de tu bebé.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sección: Familia */}
                <TouchableOpacity 
                    onPress={() => handleSelectSection('family')}
                    activeOpacity={0.7}
                >
                    <View className={`bg-white rounded-xl p-5 mb-6 shadow-sm border ${
                        selectedSections.has('family') ? 'border-orange-500 bg-orange-50' : 'border-gray-100'
                    }`}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                {isSelectionMode && (
                                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                        selectedSections.has('family') 
                                            ? 'bg-orange-500 border-orange-500' 
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedSections.has('family') && (
                                            <Feather name="check" size={14} color="white" />
                                        )}
                                    </View>
                                )}
                                <Text className="text-xl font-bold text-gray-800">Familia</Text>
                            </View>
                        </View>
                        
                        <View className="space-y-3">
                            {familyItemsWithValues.length > 0 ? (
                                familyItemsWithValues.map((item, index) => (
                                    <TouchableOpacity 
                                        key={item.id}
                                        onPress={() => handleSelectItem(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View className={`flex-row items-start p-2 rounded-lg ${
                                            selectedItems.has(item.id) ? 'bg-orange-100' : ''
                                        }`}>
                                            {isSelectionMode && (
                                                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${
                                                    selectedItems.has(item.id) 
                                                        ? 'bg-orange-500 border-orange-500' 
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedItems.has(item.id) && (
                                                        <Feather name="check" size={12} color="white" />
                                                    )}
                                                </View>
                                            )}
                                            <View className="w-2 h-2 rounded-full bg-orange-500 mt-2 mr-3" />
                                            <View className="flex-1">
                                                <Text className="text-gray-700 font-medium">{item.label}:</Text>
                                                <Text className="text-gray-600 mt-1">
                                                    {item.value}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="flex-row items-center p-4 bg-gray-50 rounded-lg">
                                    <Feather name="info" size={16} color="#6B7280" />
                                    <Text className="text-gray-500 text-sm flex-1 ml-2">
                                        No hay datos de familia para {baby?.name || 'este bebé'}. 
                                        {' '}Los datos se agregarán automáticamente cuando hables con Lumi sobre la 
                                        familia y relaciones del bebé.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

export default BabyProfile