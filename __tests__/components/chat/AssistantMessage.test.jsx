import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('@expo/vector-icons/Entypo', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props) => <Text {...props} />;
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props) => <Text {...props} />;
});

jest.mock('@expo/vector-icons/FontAwesome', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props) => <Text {...props} />;
});

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ visible, children, ...props }) => (visible ? <View {...props}>{children}</View> : null);
});

let latestChatOptionsModalProps;
const mockChatOptionsModal = jest.fn((props) => {
  latestChatOptionsModalProps = props;
  return null;
});

jest.mock('../../../src/components/chat/ChatOptionsModal', () => {
  return (props) => mockChatOptionsModal(props);
});

jest.mock('../../../src/services/FavoritesService', () => ({
  __esModule: true,
  default: {
    addToFavorites: jest.fn(),
  },
}));


jest.mock('../../../src/components/CommentModal', () => {
  const React = require('react');
  const { View, Text, TextInput, TouchableOpacity } = require('react-native');
  return ({ visible, onClose, onSubmit }) => {
    const [value, setValue] = React.useState('');
    if (!visible) return null;
    return (
      <View testID="comment-modal">
        <TextInput
          placeholder="Describe por qué la respuesta no fue útil..."
          value={value}
          onChangeText={setValue}
        />
        <TouchableOpacity onPress={onClose}><Text>Cancelar</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => {
          onSubmit(value);
          setValue('');
        }}><Text>Enviar</Text></TouchableOpacity>
      </View>
    );
  };
});
import AssistantMessage from '../../../src/components/chat/AssistantMessage';

describe('<AssistantMessage />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    latestChatOptionsModalProps = null;
    mockChatOptionsModal.mockClear();
    const FavoritesService = require('../../../src/services/FavoritesService').default;
    FavoritesService.addToFavorites.mockReset();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('envía feedback positivo y muestra confirmación', async () => {
    const onFeedback = jest.fn().mockResolvedValue({});

    const screen = render(
      <AssistantMessage
        text="Hola"
        messageId="msg-1"
        onFeedback={onFeedback}
      />
    );

    fireEvent.press(screen.getByTestId('feedback-useful'));

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalledWith('msg-1', 'useful');
    });

    expect(screen.getByText('Feedback guardado')).toBeTruthy();
  });

  it('renderiza contenido antes y después de la tabla markdown', () => {
    const markdown = [
      'Intro',
      '| Columna | Valor |',
      '| --- | --- |',
      '| Uno | 1 |',
      '| Dos | 2 |',
      'Fin',
    ].join('\n');

    const screen = render(
      <AssistantMessage
        text={markdown}
        messageId="msg-2"
        onFeedback={jest.fn()}
      />
    );

    expect(screen.getByText('Intro')).toBeTruthy();
    expect(screen.getByText('Columna')).toBeTruthy();
    expect(screen.getByText('Valor')).toBeTruthy();
    expect(screen.getByText('Fin')).toBeTruthy();
  });

  it('abre el modal de comentario y envía feedback negativo con comentario', async () => {
    const onFeedback = jest.fn().mockResolvedValue({});

    const screen = render(
      <AssistantMessage
        text="Respuesta"
        messageId="msg-3"
        onFeedback={onFeedback}
      />
    );

    fireEvent.press(screen.getByTestId('feedback-not-useful'));

    const commentArea = screen.getByPlaceholderText('Describe por qué la respuesta no fue útil...');
    fireEvent.changeText(commentArea, 'No aplica');
    fireEvent.press(screen.getByText('Enviar'));

    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalledWith('msg-3', 'not_useful', 'No aplica');
    });

    expect(screen.queryByDisplayValue('No aplica')).toBeNull();
  });

  it('agrega el mensaje a favoritos desde el menú de opciones', async () => {
    const FavoritesService = require('../../../src/services/FavoritesService').default;
    FavoritesService.addToFavorites.mockResolvedValue({});
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const screen = render(
      <AssistantMessage
        text="Respuesta"
        messageId="msg-5"
        onFeedback={jest.fn()}
      />
    );

    fireEvent.press(screen.getByTestId('assistant-options-button'));

    await waitFor(() => {
      expect(latestChatOptionsModalProps).toBeTruthy();
      expect(latestChatOptionsModalProps.visible).toBe(true);
    });

    await act(async () => {
      await latestChatOptionsModalProps.onAddToFavorites('msg-5');
    });

    expect(FavoritesService.addToFavorites).toHaveBeenCalledWith({ conversationMessageId: 'msg-5' });
    expect(alertSpy).toHaveBeenCalledWith('Favoritos', 'Mensaje agregado a favoritos');

    alertSpy.mockRestore();
  });

  it('muestra icono cuando ya existe feedback previo', () => {
    const screen = render(
      <AssistantMessage
        text="Resuelto"
        messageId="msg-4"
        onFeedback={jest.fn()}
        feedback={{ rating: 'useful' }}
      />
    );

    expect(screen.queryByTestId('feedback-useful')).toBeNull();
    expect(screen.getByText('Lumi')).toBeTruthy();
  });
});
