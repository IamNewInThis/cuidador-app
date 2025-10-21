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
import { StripeProvider } from "@stripe/stripe-react-native";

// 🔹 Componente para manejar manualmente los deep links
function DeepLinkHandler() {
  const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;
    
    const handleUrl = async (url) => {
      if (!url || !mounted) return;
      
      try {
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
            
            // Pequeño delay para asegurar que el navegador esté listo
            setTimeout(() => {
              if (mounted && navigation) {
                navigation.navigate('ResetPassword', tokens);
              }
            }, 100);
          } else {
            setTimeout(() => {
              if (mounted && navigation) {
                navigation.navigate('ResetPassword');
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('[DeepLinkHandler] Error handling URL:', error);
      }
    };

    // Verificar si la app se abrió con un link inicial
    Linking.getInitialURL().then(handleUrl).catch(console.error);

    // Escuchar nuevos eventos de deep link
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [navigation]);

  return null;
}

const linking = {
  prefixes: ['cuidador-app://', 'exp://', 'exp+cuidador-app://'],
  config: {
    screens: {
      // Pantallas de autenticación (AuthStack)
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
      
      // Pantallas de la aplicación para navegacion externa (AppStack)
      Home: 'home',
      Chat: 'chat',
      Babies: 'babies',
      ListBabies: 'list-babies',
      BabyDetail: 'baby-detail',
      ProfileSettings: 'profile-settings',
    },
  },
};

export default function App() {
  const merchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || 'merchant.cuidador-app';
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY} merchantIdentifier={merchantIdentifier}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <NavigationContainer linking={linking}>
            <DeepLinkHandler />
            <AppNavigator />
          </NavigationContainer>
        </GestureHandlerRootView>
      </AuthProvider>
    </StripeProvider>
  );
}
