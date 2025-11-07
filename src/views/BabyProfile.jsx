import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react'
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getBabies } from '../services/BabiesService';
import { getProfileBaby, getProfileByCategory } from '../services/BabyProfileServices';
import { ActivityIndicator, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    ProfileHeader,
    BabyAvatar,
    ProfileSection,
    ProfileItem,
    HealthSection
} from '../components/baby_profile';

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
            <ProfileHeader
                isSelectionMode={isSelectionMode}
                selectedCount={getTotalSelectedCount()}
                babyName={baby?.name}
                onGoBack={handleGoBack}
                onCancelSelection={handleCancelSelection}
                onEdit={handleEdit}
                onExport={handleExport}
            />
            
            <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
                <BabyAvatar 
                    name={baby?.name}
                    age={baby?.birthdate ? formatBabyAge(baby.birthdate) : ''}
                />

                <HealthSection navigation={navigation} />

                {/* Sección: Sueño y descanso */}
                <ProfileSection
                    title={t('babyProfileSleep.title')}
                    color="blue"
                    isSelected={selectedSections.has('sleep')}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleSelectSection('sleep')}
                    noDataMessage={`${t('babyProfileSleep.noSleepData', { babyName: baby?.name || 'este bebé' })} ${t('babyProfileSleep.noSleepDataDesc')}`}
                >
                    {sleepItemsWithValues.length > 0 && sleepItemsWithValues.map((item) => (
                        <ProfileItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            value={item.value}
                            color="blue"
                            isSelected={selectedItems.has(item.id)}
                            isSelectionMode={isSelectionMode}
                            onPress={() => handleSelectItem(item.id)}
                        />
                    ))}
                </ProfileSection>

                {/* Sección: Cuidados diarios */}
                <ProfileSection
                    title="Cuidados diarios"
                    color="purple"
                    isSelected={selectedSections.has('care')}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleSelectSection('care')}
                    noDataMessage={`No hay datos de cuidados diarios para ${baby?.name || 'este bebé'}. Los datos se agregarán automáticamente cuando hables con Lumi sobre alimentación, rutinas y cuidados de tu bebé.`}
                >
                    {careItemsWithValues.length > 0 && careItemsWithValues.map((item) => (
                        <ProfileItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            value={item.value}
                            color="purple"
                            isSelected={selectedItems.has(item.id)}
                            isSelectionMode={isSelectionMode}
                            onPress={() => handleSelectItem(item.id)}
                        />
                    ))}
                </ProfileSection>

                {/* Sección: Autonomía y desarrollo integral */}
                <ProfileSection
                    title="Autonomía y desarrollo integral"
                    color="blue"
                    isSelected={selectedSections.has('autonomy')}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleSelectSection('autonomy')}
                    noDataMessage={`No hay datos de autonomía para ${baby?.name || 'este bebé'}. Los datos se agregarán automáticamente cuando hables con Lumi sobre el desarrollo y la autonomía de tu bebé.`}
                >
                    {autonomyItemsWithValues.length > 0 && autonomyItemsWithValues.map((item) => (
                        <ProfileItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            value={item.value}
                            color="blue"
                            isSelected={selectedItems.has(item.id)}
                            isSelectionMode={isSelectionMode}
                            onPress={() => handleSelectItem(item.id)}
                        />
                    ))}
                </ProfileSection>

                {/* Sección: Emociones y crianza */}
                <ProfileSection
                    title="Emociones y crianza"
                    color="green"
                    isSelected={selectedSections.has('emotions')}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleSelectSection('emotions')}
                    noDataMessage={`No hay datos de emociones y crianza para ${baby?.name || 'este bebé'}. Los datos se agregarán automáticamente cuando hables con Lumi sobre el temperamento, actividades favoritas y señales de tu bebé.`}
                >
                    {emotionsItemsWithValues.length > 0 && emotionsItemsWithValues.map((item) => (
                        <ProfileItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            value={item.value}
                            color="green"
                            isSelected={selectedItems.has(item.id)}
                            isSelectionMode={isSelectionMode}
                            onPress={() => handleSelectItem(item.id)}
                        />
                    ))}
                </ProfileSection>

                {/* Sección: Familia */}
                <ProfileSection
                    title="Familia"
                    color="orange"
                    isSelected={selectedSections.has('family')}
                    isSelectionMode={isSelectionMode}
                    onPress={() => handleSelectSection('family')}
                    noDataMessage={`No hay datos de familia para ${baby?.name || 'este bebé'}. Los datos se agregarán automáticamente cuando hables con Lumi sobre la familia y relaciones del bebé.`}
                >
                    {familyItemsWithValues.length > 0 && familyItemsWithValues.map((item) => (
                        <ProfileItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            value={item.value}
                            color="orange"
                            isSelected={selectedItems.has(item.id)}
                            isSelectionMode={isSelectionMode}
                            onPress={() => handleSelectItem(item.id)}
                        />
                    ))}
                </ProfileSection>
            </ScrollView>
        </SafeAreaView>
    )
}

export default BabyProfile