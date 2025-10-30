import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react'
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getBabies } from '../services/BabiesService';
import { getProfileBaby } from '../services/BabyProfileServices';
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
        const { data, error } = await getProfileBaby(baby.id, { locale });
                if (error) {
                    console.error('Error loading baby_profile:', error);
                    setProfileEntries([]);
                    setProfileByCategory({});
                    return;
                }

                if (!mounted) return;
                setProfileEntries(data || []);

                // agrupar por category_id
                const grouped = (data || []).reduce((acc, item) => {
                    const cat = item.category_id || 'general';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                }, {});

                setProfileByCategory(grouped);
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
            const allEmotionItems = ['emotions-1', 'emotions-2', 'emotions-3', 'emotions-4'];
            const allCareItems = ['care-1', 'care-2', 'care-3', 'care-4', 'care-5'];
            const allDevelopmentItems = ['development-1', 'development-2', 'development-3'];
            const allHealthItems = ['health-1', 'health-2', 'health-3'];
            
            setSelectedSections(new Set(['sleep', 'emotions', 'care', 'development', 'health']));
            setSelectedItems(new Set([
                ...allSleepItems,
                ...allEmotionItems,
                ...allCareItems,
                ...allDevelopmentItems,
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
                    return ['emotions-1', 'emotions-2', 'emotions-3', 'emotions-4'];
                case 'care':
                    return ['care-1', 'care-2', 'care-3', 'care-4', 'care-5'];
                case 'development':
                    return ['development-1', 'development-2', 'development-3'];
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
                    return ['emotions-1', 'emotions-2', 'emotions-3', 'emotions-4'];
                case 'care':
                    return ['care-1', 'care-2', 'care-3', 'care-4', 'care-5'];
                case 'development':
                    return ['development-1', 'development-2', 'development-3'];
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

    // Configuración escalable para la sección de Sueño y Descanso
    const sleepSectionConfig = [
        {
            id: 'sleep-rhythm',
            label: t('babyProfileSleep.sleepRhythm'),
            profileKey: 'sleep_rhythm',
            defaultValue: 'Regular'
        },
        {
            id: 'day-night-difference',
            label: t('babyProfileSleep.dayNightDifference'),
            profileKey: 'day_night_difference',
            defaultValue: 'Bien establecida'
        },
        {
            id: 'sleep-location',
            label: t('babyProfileSleep.sleepLocation'),
            profileKey: 'where_sleep',
            defaultValue: 'En su cuna'
        },
        {
            id: 'sleep-accompaniment',
            label: t('babyProfileSleep.sleepAccompaniment'),
            profileKey: 'sleep_accompaniment',
            defaultValue: 'Con presencia de los padres'
        },
        {
            id: 'attachment-object',
            label: t('babyProfileSleep.attachmentObject'),
            profileKey: 'attachment_object',
            defaultValue: 'Manta suave'
        },
        {
            id: 'daily-naps',
            label: t('babyProfileSleep.dailyNaps'),
            profileKey: 'daily_naps_count',
            defaultValue: '2-3 siestas'
        },
        {
            id: 'nap-duration',
            label: t('babyProfileSleep.napDuration'),
            profileKey: 'nap_average_duration',
            defaultValue: '1-2 horas'
        },
        {
            id: 'wake-windows',
            label: t('babyProfileSleep.wakeWindows'),
            profileKey: 'wake_windows',
            defaultValue: '2-3 horas'
        },
        {
            id: 'sleep-signals',
            label: t('babyProfileSleep.sleepSignals'),
            profileKey: 'sleep_signals',
            defaultValue: 'Se frota los ojos, bosteza'
        },
        {
            id: 'sleep-association',
            label: t('babyProfileSleep.sleepAssociation'),
            profileKey: 'sleep_association',
            defaultValue: 'Lactancia o chupete'
        },
        {
            id: 'night-wakings',
            label: t('babyProfileSleep.nightWakings'),
            profileKey: 'night_wakings_count',
            defaultValue: '1-2 por noche'
        },
        {
            id: 'back-to-sleep',
            label: t('babyProfileSleep.backToSleep'),
            profileKey: 'back_to_sleep_method',
            defaultValue: 'Con ayuda de los padres'
        },
        {
            id: 'sensory-profile',
            label: t('babyProfileSleep.sensoryProfile'),
            profileKey: 'sensory_profile',
            defaultValue: 'Sensible a ruidos'
        },
        {
            id: 'calming-stimulus',
            label: t('babyProfileSleep.calmingStimulus'),
            profileKey: 'calming_stimulus',
            defaultValue: 'Música suave y caricias'
        },
        {
            id: 'room-temperature',
            label: t('babyProfileSleep.roomTemperature'),
            profileKey: 'room_temperature',
            defaultValue: '20-22°C'
        },
        {
            id: 'room-humidity',
            label: t('babyProfileSleep.roomHumidity'),
            profileKey: 'room_humidity',
            defaultValue: '40-60%'
        },
        {
            id: 'sleep-clothing',
            label: t('babyProfileSleep.sleepClothing'),
            profileKey: 'sleep_clothing',
            defaultValue: 'Pijama de algodón'
        },
        {
            id: 'sensitivity-temperament',
            label: t('babyProfileSleep.sensitivityTemperament'),
            profileKey: 'sensitivity_temperament',
            defaultValue: 'Tranquila y adaptable'
        }
    ];

    // Helper para obtener el valor del baby_profile por key
    const getProfileValue = (key, defaultValue = '') => {
        if (!profileEntries || profileEntries.length === 0) return defaultValue;
        const found = profileEntries.find(e => e.key === key);
        return found?.value ?? defaultValue;
    };

    // Helper para verificar si un campo tiene valor real en la base de datos
    const hasProfileValue = (key) => {
        if (!profileEntries || profileEntries.length === 0) return false;
        const found = profileEntries.find(e => e.key === key);
        return found && found.value && found.value.trim() !== '';
    };

    // Filtrar elementos de sueño que tienen valores reales en la BD
    const sleepItemsWithValues = sleepSectionConfig.filter(item => hasProfileValue(item.profileKey));

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
                        {/* <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                            <View className="flex-1">
                                <Text className="text-gray-700 font-medium">Estado general:</Text>
                                <Text className="text-gray-600 mt-1">Saludable - Última revisión: 15 Oct 2025</Text>
                            </View>
                        </View> */}

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
                                                    {getProfileValue(item.profileKey)}
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