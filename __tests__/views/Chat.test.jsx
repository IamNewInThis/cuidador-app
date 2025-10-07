import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/services/ConversationsService', () => ({
  __esModule: true,
  default: {
    createMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    getConversationsByBaby: jest.fn(),
  },
}));

jest.mock('../../src/services/FeedbackService', () => ({
  __esModule: true,
  default: {
    upsertFeedback: jest.fn(),
    getFeedback: jest.fn(),
  },
}));

jest.mock('../../src/services/BabiesService', () => ({
  getBabies: jest.fn(),
}));

jest.mock('../../src/components/chat/BabySelectionModal', () => () => null);

jest.mock('../../src/components/chat/ChatHeader', () => () => null);

jest.mock('../../src/components/chat/AssistantMessage', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ text }) => <Text>{text}</Text>;
});

const mockedUseAuth = require('../../src/contexts/AuthContext').useAuth;
const mockedConversationsService = require('../../src/services/ConversationsService').default;
const mockedFeedbackService = require('../../src/services/FeedbackService').default;
const mockedGetBabies = require('../../src/services/BabiesService').getBabies;

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('<Chat />', () => {
  const renderChat = () => {
    const Chat = require('../../src/views/Chat').default;
    return render(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <Chat />
      </SafeAreaProvider>
    );
  };

  beforeEach(() => {
    consoleErrorSpy.mockClear();
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      session: { access_token: 'token-123' },
      user: { id: 'user-1' },
    });

    let sequence = 0;
    mockedConversationsService.getConversationHistory.mockResolvedValue([]);
    mockedConversationsService.getConversationsByBaby.mockResolvedValue([]);
    mockedConversationsService.createMessage.mockImplementation(async ({ role, content }) => ({
      id: `${role}-${++sequence}`,
      content,
      role,
    }));
    mockedFeedbackService.getFeedback.mockResolvedValue(null);
    mockedFeedbackService.upsertFeedback.mockResolvedValue({});
    mockedGetBabies.mockResolvedValue({ data: [], error: null });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('carga el historial de conversación al montar', async () => {
    renderChat();

    await waitFor(() => {
      expect(mockedConversationsService.getConversationHistory).toHaveBeenCalledTimes(1);
    });
  });

  it('renderiza historial existente y solicita feedback de mensajes del asistente', async () => {
    mockedConversationsService.getConversationHistory.mockResolvedValueOnce([
      { id: 'a-1', role: 'assistant', content: 'Respuesta generada' },
      { id: 'u-1', role: 'user', content: 'Pregunta original' },
    ]);

    const screen = renderChat();

    await waitFor(() => {
      expect(screen.getByText('Pregunta original')).toBeTruthy();
      expect(screen.getByText('Respuesta generada')).toBeTruthy();
    });

    expect(mockedFeedbackService.getFeedback).toHaveBeenCalledWith('a-1', 'user-1');
  });

  it('selecciona automáticamente el primer bebé disponible y carga sus conversaciones', async () => {
    mockedGetBabies.mockResolvedValueOnce({
      data: [{ id: 'baby-1', name: 'Luna' }],
      error: null,
    });

    renderChat();

    await waitFor(() => {
      expect(mockedConversationsService.getConversationsByBaby).toHaveBeenCalledWith('baby-1');
    });

    expect(mockedConversationsService.getConversationHistory).toHaveBeenCalled();
  });

  it('muestra aviso cuando no hay sesión activa', async () => {
    mockedUseAuth.mockReturnValue({ session: null, user: { id: 'user-1' } });
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ json: async () => ({}) });

    const screen = renderChat();

    await waitFor(() => {
      expect(mockedConversationsService.getConversationHistory).toHaveBeenCalledTimes(1);
    });

    fireEvent.changeText(screen.getByPlaceholderText('Pregúntale a Lumi...'), 'Hola');
    fireEvent.press(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getByText('Error: Debes iniciar sesión para usar el chat.')).toBeTruthy();
    });

    expect(mockedConversationsService.createMessage).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('muestra mensaje de error cuando la petición al servidor falla', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    const screen = renderChat();

    await waitFor(() => {
      expect(mockedConversationsService.getConversationHistory).toHaveBeenCalled();
    });

    fireEvent.changeText(screen.getByPlaceholderText('Pregúntale a Lumi...'), 'Hola');
    fireEvent.press(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getByText('Error al conectar con el servidor.')).toBeTruthy();
    });

    expect(mockedConversationsService.createMessage).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });
});
