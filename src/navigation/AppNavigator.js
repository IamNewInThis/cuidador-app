// navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Importa tus vistas existentes
import Home from '../views/Home';
import Chat from '../views/Chat';
import SignIn from '../views/SignIn';
import SignUp from '../views/SignUp';
import Babies from '../views/Babies';
import ListBabies from '../views/ListBabies';
import BabyDetail from '../views/BabyDetail';
import ProfileSettings from '../views/ProfileSettings';
import ResetPasswordScreen from '../views/ResetPassword';
import ForgotPassword from '../views/ForgotPassword';
import CompleteProfile from '../views/CompleteProfile';
import FavoritesView from '../views/FavoritesView';
import CategoryDetailView from '../views/CategoryDetailView';
import SubscriptionView from '../views/SubscriptionView';
import SettingsView from '../views/SettingsView';

const Stack = createStackNavigator();

// Stack para usuarios no autenticados
const AuthStack = () => (
    <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{
            headerShown: false,
        }}
    >
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
);

// Stack para usuarios autenticados
const AppStack = () => (
    <Stack.Navigator
        initialRouteName="Chat"
        screenOptions={{
            headerShown: false,
        }}
    >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Babies" component={Babies} />
        <Stack.Screen name="ListBabies" component={ListBabies} />
        <Stack.Screen name="BabyDetail" component={BabyDetail} />
        <Stack.Screen name="ProfileSettings" component={ProfileSettings} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfile} />
        <Stack.Screen name="Favorites" component={FavoritesView} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailView} />
        <Stack.Screen name="SettingsView" component={SettingsView} />
        <Stack.Screen name="SubscriptionView" component={SubscriptionView} />
    </Stack.Navigator>
);

export default function AppNavigator() {
    const { session, loading, needsProfileCompletion } = useAuth();

    // Mostrar loading mientras se verifica la sesión
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // Si no hay sesión, mostrar el stack de autenticación
    if (!session) {
        return <AuthStack />;
    }

    // Si hay sesión pero necesita completar el perfil, mostrar CompleteProfile
    if (needsProfileCompletion) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="CompleteProfile" component={CompleteProfile} />
            </Stack.Navigator>
        );
    }

    // Si hay sesión y el perfil está completo, mostrar la app
    return <AppStack />;
}
