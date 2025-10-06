import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/Button';

describe('<Button />', () => {
  it('renderiza el texto y responde al onPress', () => {
    const handlePress = jest.fn();

    const { getByText } = render(
      <Button title="Guardar" className="bg-blue-500" onPress={handlePress} />
    );

    fireEvent.press(getByText('Guardar'));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('muestra el icono y respeta el estado disabled', () => {
    const handlePress = jest.fn();

    const { getByText } = render(
      <Button
        title="Enviar"
        className="bg-gray-200"
        onPress={handlePress}
        icon={<Text>Icon</Text>}
        disabled
      />
    );

    fireEvent.press(getByText('Enviar'));

    expect(getByText('Icon')).toBeTruthy();
    expect(handlePress).not.toHaveBeenCalled();
  });
});
