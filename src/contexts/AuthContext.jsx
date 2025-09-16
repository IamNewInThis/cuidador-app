// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const { data } = await supabase.auth.getSession();
                if (!mounted) return;
                setSession(data?.session ?? null);
                setUser(data?.session?.user ?? null);
            } catch (e) {
                if (!mounted) return;
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session ?? null);
            setUser(session?.user ?? null);
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe?.();
        };
    }, []);

    const signIn = async (email, password) => {
        console.log('[AuthContext] signIn called with email:', email);
        setAuthError(null);
        setLoading(true);
        
        try {
            console.log('[AuthContext] Calling supabase.auth.signInWithPassword...');
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email: email.trim(),
                password: password 
            });
            
            // console.log('[AuthContext] supabase.auth response:', { data, error });
            
            if (error) {
                console.error('[AuthContext] Authentication error:', error);
                setAuthError(error);
                throw error;
            }
            
            // console.log('[AuthContext] Authentication successful, user:', data.user);

            // const token = data.session?.access_token;
            // console.log('[AuthContext] Token:', token);

            setSession(data.session);
            setUser(data.user);
            return data;
        } catch (error) {
            console.error('[AuthContext] Error in signIn:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async ({ email, password, ...metadata }) => {
        setAuthError(null);
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata },
        });
        setLoading(false);
        if (error) {
            setAuthError(error);
            throw error;
        }
        setSession(data.session ?? null);
        setUser(data.user ?? null);
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    const signInWithGoogle = async () => {
        setAuthError(null);
        setLoading(true);

        try {
            const redirectUrl = makeRedirectUri({ useProxy: true });

            const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) {
                console.error('[AuthContext] Google sign-in error:', error);
                setAuthError(error);
                throw error;
            }

            if (data?.url) {
                // Abre el navegador web para la autenticación
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );
                
                if (result.type === 'success') {
                    const { url } = result;
                    console.log('[AuthContext] Auth success, URL:', url);
                } else {
                    throw new Error('User cancelled or auth failed');
                }
            }

            return data;
        } catch (error) {
            console.error('[AuthContext] Error in signInWithGoogle:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signInWithApple = async () => {
        setAuthError(null);
        setLoading(true);
        try {
            console.log('[AppleAuth] Iniciando signInWithApple...');

            const available = await AppleAuthentication.isAvailableAsync();
            console.log('[AppleAuth] Disponible:', available);
            if (!available) throw new Error('Apple Sign-In no disponible en este dispositivo.');

            const rawNonce = Crypto.randomUUID();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce
            );
            console.log('[AppleAuth] Nonce generado:', rawNonce);
            console.log('[AppleAuth] Nonce hasheado:', hashedNonce);

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });

            console.log('[AppleAuth] Credencial recibida:', credential);

            if (!credential.identityToken) throw new Error('No se recibió identityToken de Apple');

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
                nonce: rawNonce,
            });

            console.log('[AppleAuth] Respuesta de Supabase:', { data, error });

            if (error) {
                console.error('[AppleAuth] Error en Supabase:', error);
                throw error;
            }

            if (credential.fullName) {
                const fullName = `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim();
                console.log('[AppleAuth] Nombre completo detectado:', fullName);
                if (fullName) {
                    await supabase.auth.updateUser({ data: { full_name: fullName } })
                        .then(() => console.log('[AppleAuth] Nombre actualizado en Supabase'))
                        .catch(err => console.error('[AppleAuth] Error al actualizar nombre:', err));
                }
            }

            console.log('[AppleAuth] Inicio de sesión con Apple exitoso 🎉');
            return data;
        } catch (e) {
            console.error('[AppleAuth] Error general:', e);
            setAuthError(e);
            throw e;
        } finally {
            console.log('[AppleAuth] Finalizó el flujo de Apple Sign-In');
            setLoading(false);
        }
    };



    return (
        <AuthContext.Provider value={{ user, session, loading, authError, signIn, signUp, signOut, signInWithGoogle, signInWithApple }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
