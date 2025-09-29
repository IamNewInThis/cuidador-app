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
    const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

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

    // Función para verificar si el perfil está completo
    const checkProfileCompletion = async (userId) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('phone, birthdate, country, relationship_to_baby')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('[AuthContext] Error verificando perfil:', error);
                return true; // En caso de error, asumir que está completo para no bloquear
            }

            // El perfil está incompleto si falta alguno de estos campos obligatorios
            const isIncomplete = !profile?.phone || !profile?.birthdate || !profile?.country || !profile?.relationship_to_baby;
            
            console.log('[AuthContext] Perfil completo:', !isIncomplete, profile);
            setNeedsProfileCompletion(isIncomplete);
            
            return !isIncomplete;
        } catch (error) {
            console.error('[AuthContext] Error en checkProfileCompletion:', error);
            return true; // En caso de error, asumir que está completo
        }
    };

    // Función para completar el perfil
    const completeProfile = async (profileData) => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    phone: profileData.phone?.trim(),
                    birthdate: profileData.birthdate,
                    country: profileData.country,
                    relationship_to_baby: profileData.relationshipToBaby
                })
                .eq('id', user.id);

            if (error) throw error;

            setNeedsProfileCompletion(false);
            console.log('[AuthContext] Perfil completado exitosamente');
            return true;
        } catch (error) {
            console.error('[AuthContext] Error completando perfil:', error);
            setAuthError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

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

    const sendPasswordResetEmail = async (email) => {
        setAuthError(null);
        setLoading(true);

        try {
            console.log('[AuthContext] Enviando email de recuperación a:', email);
            
            // Cerrar sesión activa
            await supabase.auth.signOut();
            
            // Construir la URL de redirección completa
            const redirectUrl = 'cuidador-app://auth/reset';
            
            // console.log('[AuthContext] URL de redirección para reset:', redirectUrl);

            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;
            
            // console.log('[AuthContext] Email de recuperación enviado correctamente');
            return data;
        } catch (e) {
            console.error('[AuthContext] Error en sendPasswordResetEmail:', e);
            setAuthError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (newPassword) => {
        setAuthError(null);
        setLoading(true);

        try {
            console.log('[AuthContext] Intentando actualizar contraseña...');
            
            // Intentar actualizar la contraseña
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('[AuthContext] Error al actualizar contraseña:', error);
                throw error;
            }

            // Si la actualización fue exitosa, intentamos obtener la nueva sesión
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('[AuthContext] Error al obtener sesión después de actualizar:', sessionError);
            } else if (session) {
                console.log('[AuthContext] Nueva sesión obtenida después de actualizar contraseña');
                setSession(session);
                setUser(session.user);
            }

            return true;
        } catch (e) {
            console.error('[AuthContext] Error en updatePassword:', e);
            setAuthError(e);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setAuthError(null);
        setLoading(true);

        try {
            const redirectUrl = makeRedirectUri({
                scheme: 'cuidador-app',
                path: 'auth/callback',
            });

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    queryParams: { prompt: 'select_account' },
                },
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                if (result.type === 'success' && result.url) {
                    // 👇 Parsear el fragmento con query-string
                    const url = new URL(result.url);
                    const hashParams = new URLSearchParams(url.hash.substring(1));

                    const parsed = {
                        access_token: hashParams.get('access_token'),
                        refresh_token: hashParams.get('refresh_token'),
                        expires_in: hashParams.get('expires_in'),
                        expires_at: hashParams.get('expires_at'),
                        provider_token: hashParams.get('provider_token'),
                    };

                    console.log('[GoogleAuth] Tokens recibidos:', parsed);

                    // Guardar la sesión en Supabase manualmente
                    const { data: sessionData, error: setError } = await supabase.auth.setSession({
                        access_token: parsed.access_token,
                        refresh_token: parsed.refresh_token,
                    });

                    if (setError) throw setError;

                    console.log('[GoogleAuth] Sesión creada:', sessionData.session.user);

                    setSession(sessionData.session);
                    setUser(sessionData.session.user);

                    // Verificar si el perfil existe, si no, crearlo manualmente
                    if (sessionData.session?.user) {
                        try {
                            const { data: existingProfile } = await supabase
                                .from('profiles')
                                .select('id')
                                .eq('id', sessionData.session.user.id)
                                .single();

                            if (!existingProfile) {
                                console.log('[GoogleAuth] Creando perfil manualmente...');
                                const { error: profileError } = await supabase
                                    .from('profiles')
                                    .insert([{
                                        id: sessionData.session.user.id,
                                        email: sessionData.session.user.email,
                                        name: sessionData.session.user.user_metadata?.full_name || sessionData.session.user.user_metadata?.name,
                                        created_at: new Date().toISOString()
                                    }]);

                                if (profileError) {
                                    console.error('[GoogleAuth] Error al crear perfil:', profileError);
                                } else {
                                    console.log('[GoogleAuth] Perfil creado exitosamente');
                                }
                            } else {
                                console.log('[GoogleAuth] Perfil ya existe');
                            }
                        } catch (profileCheckError) {
                            console.error('[GoogleAuth] Error al verificar/crear perfil:', profileCheckError);
                        }

                        // Verificar si el perfil necesita completarse
                        await checkProfileCompletion(sessionData.session.user.id);
                    }
                }
            }
        } catch (e) {
            console.error('[GoogleAuth] Error en signInWithGoogle:', e);
            setAuthError(e);
        } finally {
            setLoading(false);
        }
    };

    const signInWithApple = async () => {
        setAuthError(null);
        setLoading(true);
        try {
            console.log('[AppleAuth] Iniciando signInWithApple...');

            // Verificar disponibilidad con más detalle
            try {
                const available = await AppleAuthentication.isAvailableAsync();
                console.log('[AppleAuth] Disponible:', available);
                if (!available) {
                    throw new Error('Apple Sign-In no está disponible en este dispositivo. Verifica que hayas iniciado sesión en iCloud.');
                }
            } catch (availabilityError) {
                console.error('[AppleAuth] Error de disponibilidad:', availabilityError);
                throw new Error('No se pudo verificar la disponibilidad de Apple Sign-In. ¿Has iniciado sesión en iCloud?');
            }

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
                // Asegurar que usamos el bundle ID correcto
                webAuthenticationOptions: {
                    clientId: 'com.takeeko.cuidadorapp',
                    redirectURI: 'cuidador-app://auth/callback',
                },
            });

            console.log('[AppleAuth] Credencial recibida:', credential);

            if (!credential.identityToken) throw new Error('No se recibió identityToken de Apple');
            
            console.log('[AppleAuth] Identity Token recibido:', credential.identityToken.substring(0, 20) + '...');
            console.log('[AppleAuth] User ID:', credential.user);

            // Preparar metadatos con la información de Apple (solo si Apple los proporciona)
            const userMetadata = {};
            
            if (credential.fullName && (credential.fullName.givenName || credential.fullName.familyName)) {
                const fullName = `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim();
                if (fullName) {
                    userMetadata.full_name = fullName;
                    userMetadata.name = fullName; // También como 'name' para el trigger
                    console.log('[AppleAuth] Nombre completo detectado:', fullName);
                }
            }

            if (credential.email) {
                userMetadata.email = credential.email;
                console.log('[AppleAuth] Email detectado:', credential.email);
            }

            // Si Apple no proporciona datos (login posterior), los metadatos estarán vacíos
            console.log('[AppleAuth] Metadatos a enviar:', userMetadata);

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
                nonce: rawNonce,
                options: Object.keys(userMetadata).length > 0 ? {
                    data: userMetadata
                } : undefined
            });

            console.log('[AppleAuth] Respuesta de Supabase:', { data, error });

            if (error) {
                console.error('[AppleAuth] Error en Supabase:', error);
                throw error;
            }

            // Manejar datos de Apple (solo se proporcionan en el primer login)
            if (data.user) {
                let needsUpdate = false;
                const updates = {};

                // Si Apple proporcionó datos nuevos, actualizarlos
                if (userMetadata.full_name && !data.user.user_metadata?.full_name) {
                    updates.data = { 
                        ...data.user.user_metadata, 
                        full_name: userMetadata.full_name,
                        name: userMetadata.full_name
                    };
                    needsUpdate = true;
                }

                if (userMetadata.email && !data.user.email) {
                    updates.email = userMetadata.email;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    console.log('[AppleAuth] Actualizando usuario con datos nuevos:', updates);
                    try {
                        await supabase.auth.updateUser(updates);
                        console.log('[AppleAuth] Usuario actualizado en Supabase');
                    } catch (updateError) {
                        console.error('[AppleAuth] Error al actualizar usuario:', updateError);
                    }
                }

                // Verificar si el perfil existe, si no, crearlo manualmente
                try {
                    const { data: existingProfile, error: profileError } = await supabase
                        .from('profiles')
                        .select('id, name, email')
                        .eq('id', data.user.id)
                        .single();

                    if (profileError && profileError.code !== 'PGRST116') {
                        // Error diferente a "no rows found"
                        console.error('[AppleAuth] Error al consultar perfil:', profileError);
                    }

                    if (!existingProfile) {
                        console.log('[AppleAuth] Creando perfil manualmente...');
                        
                        // Usar los datos de Apple si los tenemos, sino los datos existentes del usuario
                        const profileData = {
                            id: data.user.id,
                            email: userMetadata.email || data.user.email,
                            name: userMetadata.full_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name,
                            created_at: new Date().toISOString()
                        };

                        console.log('[AppleAuth] Datos del perfil a crear:', profileData);

                        const { error: createProfileError } = await supabase
                            .from('profiles')
                            .insert([profileData]);

                        if (createProfileError) {
                            console.error('[AppleAuth] Error al crear perfil:', createProfileError);
                        } else {
                            console.log('[AppleAuth] Perfil creado exitosamente');
                        }
                    } else {
                        console.log('[AppleAuth] Perfil existente encontrado:', existingProfile);
                        
                        // Si el perfil existe pero faltan datos, actualizarlo
                        const profileUpdates = {};
                        let needsProfileUpdate = false;

                        if (userMetadata.full_name && !existingProfile.name) {
                            profileUpdates.name = userMetadata.full_name;
                            needsProfileUpdate = true;
                        }

                        if (userMetadata.email && !existingProfile.email) {
                            profileUpdates.email = userMetadata.email;
                            needsProfileUpdate = true;
                        }

                        if (needsProfileUpdate) {
                            console.log('[AppleAuth] Actualizando perfil con:', profileUpdates);
                            const { error: updateProfileError } = await supabase
                                .from('profiles')
                                .update(profileUpdates)
                                .eq('id', data.user.id);

                            if (updateProfileError) {
                                console.error('[AppleAuth] Error al actualizar perfil:', updateProfileError);
                            } else {
                                console.log('[AppleAuth] Perfil actualizado exitosamente');
                            }
                        }
                    }
                } catch (profileCheckError) {
                    console.error('[AppleAuth] Error al verificar/crear perfil:', profileCheckError);
                }

                // Verificar si el perfil necesita completarse
                await checkProfileCompletion(data.user.id);
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
        <AuthContext.Provider value={{ 
            user, 
            session, 
            loading, 
            authError, 
            needsProfileCompletion,
            signIn, 
            signUp, 
            signOut, 
            sendPasswordResetEmail, 
            updatePassword,
            signInWithGoogle, 
            signInWithApple,
            completeProfile,
            checkProfileCompletion
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);