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
  },
}));

jest.mock('../../src/services/FeedbackService', () => ({
  __esModule: true,
  default: {
    upsertFeedback: jest.fn(),
    getFeedback: jest.fn(),
  },
}));

const mockedUseAuth = require('../../src/contexts/AuthContext').useAuth;
const mockedConversationsService = require('../../src/services/ConversationsService').default;
const mockedFeedbackService = require('../../src/services/FeedbackService').default;

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
    mockedConversationsService.createMessage.mockImplementation(async ({ role, content }) => ({
      id: `${role}-${++sequence}`,
      content,
      role,
    }));
    mockedFeedbackService.getFeedback.mockResolvedValue(null);
    mockedFeedbackService.upsertFeedback.mockResolvedValue({});
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

  it('muestra aviso cuando no hay sesión activa', async () => {
    mockedUseAuth.mockReturnValue({ session: null, user: { id: 'user-1' } });
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ json: async () => ({}) });

    const screen = renderChat();

    fireEvent.changeText(screen.getByPlaceholderText('Envía un mensaje a Lumi...'), 'Hola');
    fireEvent.press(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(screen.getByText('Error: Debes iniciar sesión para usar el chat.')).toBeTruthy();
    });

    expect(mockedConversationsService.createMessage).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
