import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';

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

jest.mock('../../src/components/PhoneInput', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return ({ value, onChangeText, placeholder = 'Número de teléfono' }) => (
    <TextInput
      testID="phone-input"
      value={value}
      placeholder={placeholder}
      onChangeText={onChangeText}
    />
  );
});

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Picker = ({ selectedValue, onValueChange, testID, children }) => (
    <View testID={testID} onValueChange={onValueChange} selectedValue={selectedValue}>
      {children}
    </View>
  );
  Picker.Item = ({ label, value }) => <Text>{`${label}:${value}`}</Text>;
  return { Picker };
});

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

import { useAuth } from '../../src/contexts/AuthContext';

const renderCompleteProfile = () => {
  const CompleteProfile = require('../../src/views/CompleteProfile').default;
  return render(<CompleteProfile />);
};

describe('<CompleteProfile />', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    alertSpy.mockClear();
    Platform.OS = 'android';
  });

  afterAll(() => {
    Platform.OS = originalPlatform;
  });

  it('valida que el teléfono es obligatorio', () => {
    useAuth.mockReturnValue({ completeProfile: jest.fn(), loading: false });

    const screen = renderCompleteProfile();

    fireEvent.press(screen.getByText('Completar perfil'));

    expect(alertSpy).toHaveBeenCalledWith('Error', 'El teléfono es obligatorio');
  });

  it('exige seleccionar país antes de enviar', () => {
    useAuth.mockReturnValue({ completeProfile: jest.fn(), loading: false });

    const screen = renderCompleteProfile();

    fireEvent.changeText(screen.getByTestId('phone-input'), '987654321');
    fireEvent.press(screen.getByText('Completar perfil'));

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Por favor selecciona tu país');
  });

  it('envía perfil completo y navega a Home tras éxito', async () => {
    const completeProfile = jest.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ completeProfile, loading: false });

    const screen = renderCompleteProfile();

    fireEvent.changeText(screen.getByTestId('phone-input'), '987654321');
    fireEvent(screen.getByTestId('country-picker'), 'valueChange', 'CL');
    fireEvent(screen.getByTestId('relation-picker'), 'valueChange', 'mother');

    fireEvent.press(screen.getByText('Completar perfil'));

    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalled();
    });

    const payload = completeProfile.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({
      phone: '987654321',
      country: 'CL',
      relationshipToBaby: 'mother',
      birthdate: expect.any(String),
    }));

    expect(alertSpy).toHaveBeenCalledWith(
      '¡Perfil completado!',
      'Tu perfil ha sido completado exitosamente.',
      expect.any(Array)
    );

    const actions = alertSpy.mock.calls[0][2];
    expect(actions[0].text).toBe('Continuar');
    actions[0].onPress();

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
