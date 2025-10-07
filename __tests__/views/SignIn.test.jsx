import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';


jest.mock('@expo/vector-icons/AntDesign', () => () => null);
jest.mock('@expo/vector-icons/FontAwesome', () => () => null);
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

import { useAuth } from '../../src/contexts/AuthContext';

const renderSignIn = () => {
  const SignIn = require('../../src/views/SignIn').default;
  return render(<SignIn />);
};

describe('<SignIn />', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    Platform.OS = 'android';
  });

  afterAll(() => {
    Platform.OS = originalPlatform;
  });

  it('envía credenciales con email normalizado', async () => {
    const signIn = jest.fn().mockResolvedValue({});

    useAuth.mockReturnValue({
      signIn,
      loading: false,
      authError: null,
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
    });

    const screen = renderSignIn();

    fireEvent.changeText(screen.getByPlaceholderText('auth.email'), ' user@example.com ');
    fireEvent.changeText(screen.getByPlaceholderText('auth.password'), 'secret');
    fireEvent.press(screen.getAllByText('auth.signInTitle')[1]);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('user@example.com', 'secret');
    });
  });

  it('muestra mensaje de error cuando authError existe', () => {
    useAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      authError: { message: 'Credenciales inválidas' },
      signInWithGoogle: jest.fn(),
      signInWithApple: jest.fn(),
    });

    const screen = renderSignIn();

    expect(screen.getByText('Credenciales inválidas')).toBeTruthy();
  });

  it('dispara inicio de sesión con Google y navegación a ForgotPassword', () => {
    const signInWithGoogle = jest.fn();
    useAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      authError: null,
      signInWithGoogle,
      signInWithApple: jest.fn(),
    });

    const screen = renderSignIn();

    fireEvent.press(screen.getByText('auth.google'));
    expect(signInWithGoogle).toHaveBeenCalled();

    fireEvent.press(screen.getByText('auth.forgotPassword'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('muestra botón de Apple en iOS y ejecuta signInWithApple', () => {
    Platform.OS = 'ios';
    const signInWithApple = jest.fn();

    useAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      authError: null,
      signInWithGoogle: jest.fn(),
      signInWithApple,
    });

    const screen = renderSignIn();

    fireEvent.press(screen.getByText('auth.apple'));
    expect(signInWithApple).toHaveBeenCalled();
  });
});
