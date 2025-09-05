// navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Importa tus vistas existentes
import Home from '../views/Home';
import Chat from '../views/Chat';
import SignIn from '../views/SignIn';
import SignUp from '../views/SignUp';
import Babies from '../views/Babies';
import ListBabies from '../views/ListBabies';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Chat" component={Chat} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="Babies" component={Babies} />
            <Stack.Screen name="ListBabies" component={ListBabies} />
        </Stack.Navigator>
    );
}
