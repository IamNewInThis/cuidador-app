import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MedicalConditionsService from '../../services/MedicalConditionsService';
import { useTranslation } from 'react-i18next';
import { getMedicalConditionTranslation } from '../../locales/medicalConditionsKeys';

const HealthSection = ({ navigation, baby }) => {
    const { t, i18n } = useTranslation();
    const [medicalConditions, setMedicalConditions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Obtener idioma actual
    const getCurrentLanguage = () => {
        return i18n?.language || 'es';
    };

    // Cargar condiciones médicas cuando el componente se monta o cambia el bebé
    useEffect(() => {
        loadMedicalConditions();
    }, [baby?.id]);

    // Re-renderizar cuando cambie el idioma para actualizar las traducciones
    const currentLanguage = getCurrentLanguage();

    const loadMedicalConditions = async () => {
        if (!baby?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const conditions = await MedicalConditionsService.getMedicalConditionsByBaby(baby.id);
            setMedicalConditions(conditions || []);
        } catch (error) {
            console.error('Error cargando condiciones médicas:', error);
            setMedicalConditions([]);
        } finally {
            setLoading(false);
        }
    };

    // Obtener todas las condiciones traducidas para mostrar
    const allConditions = medicalConditions.map(c => {
        const currentLang = getCurrentLanguage();
        return getMedicalConditionTranslation(c.condition_name, currentLang);
    });
    const totalConditions = allConditions.length;

    return (
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
                    <Text className="text-xl font-bold text-gray-800">{t('healthSection.title')}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </View>

            {/* Seccion de Alergias */}
            <View className="space-y-3">
                <View className="flex-row items-start">
                    <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                    <View className="flex-1">
                        <Text className="text-gray-700 font-medium">{t('healthSection.allergies')}</Text>
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
            </View>

            <View className="space-y-3">
                {loading ? (
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-gray-300 mt-2 mr-3" />
                        <Text className="text-gray-500">{t('healthSection.loadingHealth')}</Text>
                    </View>
                ) : (
                    <>
                        {/* Condiciones médicas */}
                        {totalConditions > 0 ? (
                            <View className="flex-row items-start">
                                <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                                <View className="flex-1">
                                    <Text className="text-gray-700 font-medium">{t('healthSection.medicalConditions')}</Text>
                                    <View className="flex-row flex-wrap mt-1">
                                        {allConditions.slice(0, 3).map((condition, conditionIndex) => (
                                            <View 
                                                key={conditionIndex} 
                                                className="bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 mr-1 mb-1"
                                            >
                                                <Text className="text-orange-700 text-xs">{condition}</Text>
                                            </View>
                                        ))}
                                        {allConditions.length > 3 && (
                                            <View className="bg-gray-100 rounded-full px-2 py-0.5">
                                                <Text className="text-gray-600 text-xs">{t('healthSection.moreConditions', { count: allConditions.length - 3 })}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View className="flex-row items-start">
                                <View className="w-2 h-2 rounded-full bg-gray-300 mt-2 mr-3" />
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-medium">
                                        {t('healthSection.noMedicalConditions')}
                                    </Text>
                                    <Text className="text-gray-400 text-xs mt-1">
                                        {t('healthSection.noMedicalConditionsDesc')}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Resumen total */}
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3" />
                            <View className="flex-1">
                                <Text className="text-gray-600 text-sm">
                                    {totalConditions > 0 
                                        ? t('healthSection.totalConditions', { count: totalConditions })
                                        : t('healthSection.noConditionsRegistered')
                                    }
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Indicador de navegación */}
                <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-blue-600 text-sm font-medium">{t('healthSection.seeFullDetails')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default HealthSection;