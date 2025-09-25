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
        initialRouteName="Home"
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
    </Stack.Navigator>
);

export default function AppNavigator() {
    const { session, loading } = useAuth();

    // Mostrar loading mientras se verifica la sesión
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // Retornar el stack apropiado basado en el estado de autenticación
    return session ? <AppStack /> : <AuthStack />;
}
