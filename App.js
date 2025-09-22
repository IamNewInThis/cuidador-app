import "./global.css";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import i18n from './src/lib/18n';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

// 🔹 Componente para manejar manualmente los deep links
function DeepLinkHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url) return;
      console.log('[DeepLinkHandler] URL recibida:', url);

      if (url.includes('auth/reset')) {
        const hash = url.split('#')[1];
        if (hash) {
          const params = new URLSearchParams(hash);
          const tokens = {
            access_token: params.get('access_token'),
            refresh_token: params.get('refresh_token'),
            type: params.get('type')
          };
          console.log('[DeepLinkHandler] Tokens extraídos:', tokens);
          
          // Navegar a ResetPassword con los tokens
          navigation.navigate('ResetPassword', tokens);
        } else {
          navigation.navigate('ResetPassword');
        }
      }
    };

    // Verificar si la app se abrió con un link inicial
    Linking.getInitialURL().then(handleUrl);

    // Escuchar nuevos eventos de deep link
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return null;
}

const linking = {
  prefixes: ['cuidador-app://', 'exp://', 'exp+cuidador-app://'],
  config: {
    screens: {
      SignIn: 'signin',
      SignUp: 'signup',
      ResetPassword: {
        path: 'auth/reset',
        parse: {
          access_token: (value) => value,
          refresh_token: (value) => value,
          type: (value) => value,
        },
      },
      ForgotPassword: 'auth/forgot',
    },
    initialRouteName: 'SignIn',
  },
};

export default function App() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer linking={linking}>
          <DeepLinkHandler />
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
