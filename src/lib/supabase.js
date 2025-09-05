// src/supabase.js
// Cliente Supabase para React Native
// Requiere: @supabase/supabase-js y @react-native-async-storage/async-storage
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    detectSessionInUrl: false,
    autoRefreshToken: true, 
    persistSession: true, 
  },
});

export default supabase;
