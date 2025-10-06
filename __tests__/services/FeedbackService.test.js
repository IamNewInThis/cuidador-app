jest.mock('../../src/lib/supabase', () => ({
  auth: { getUser: jest.fn() },
  from: jest.fn(),
}));

import FeedbackService from '../../src/services/FeedbackService';
import supabase from '../../src/lib/supabase';

describe('FeedbackService', () => {
  let upsertSpy;
  let selectSpy;
  let selectMaybeSingleSpy;
  let matchSpy;
  let matchMaybeSingleSpy;
  let deleteSpy;
  let deleteMatchSpy;

  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();

    selectMaybeSingleSpy = jest.fn();
    matchMaybeSingleSpy = jest.fn();

    matchSpy = jest.fn(() => ({ maybeSingle: matchMaybeSingleSpy }));
    selectSpy = jest.fn(() => ({ maybeSingle: selectMaybeSingleSpy, match: matchSpy }));
    upsertSpy = jest.fn(() => ({ select: selectSpy }));

    deleteMatchSpy = jest.fn();
    deleteSpy = jest.fn(() => ({ match: deleteMatchSpy }));

    supabase.from.mockImplementation((table) => {
      if (table !== 'feedback') {
        throw new Error(`Unexpected table ${table}`);
      }
      return {
        upsert: upsertSpy,
        select: selectSpy,
        delete: deleteSpy,
      };
    });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('upsertFeedback', () => {
    it('guarda feedback y retorna la fila creada', async () => {
      const response = { id: 'fb-1', rating: 'useful' };

      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      selectMaybeSingleSpy.mockResolvedValue({ data: response, error: null });

      const result = await FeedbackService.upsertFeedback({
        conversationMessageId: 'msg-1',
        rating: 'useful',
      });

      expect(result).toEqual(response);
      expect(upsertSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          conversation_message_id: 'msg-1',
          user_id: 'user-1',
          rating: 'useful',
          comment: null,
          updated_at: expect.any(String),
        }),
      ], { onConflict: ['conversation_message_id', 'user_id'] });
      expect(selectMaybeSingleSpy).toHaveBeenCalled();
    });

    it('retorna error cuando no hay usuario autenticado', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await FeedbackService.upsertFeedback({
        conversationMessageId: 'msg-2',
        rating: 'useful',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it('propaga errores de Supabase', async () => {
      const failure = new Error('insert failed');
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null });
      selectMaybeSingleSpy.mockResolvedValue({ data: null, error: failure });

      const result = await FeedbackService.upsertFeedback({
        conversationMessageId: 'msg-3',
        rating: 'not_useful',
        comment: 'Needs review',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe(failure);
    });
  });

  describe('getFeedback', () => {
    it('recupera feedback almacenado', async () => {
      const row = { id: 'fb-10', rating: 'useful' };
      matchMaybeSingleSpy.mockResolvedValue({ data: row, error: null });

      const data = await FeedbackService.getFeedback('msg-10', 'user-10');

      expect(selectSpy).toHaveBeenCalledWith('*');
      expect(matchSpy).toHaveBeenCalledWith({
        conversation_message_id: 'msg-10',
        user_id: 'user-10',
      });
      expect(data).toEqual(row);
    });
  });

  describe('deleteFeedback', () => {
    it('lanza error cuando Supabase devuelve error', async () => {
      const failure = new Error('delete failed');
      deleteMatchSpy.mockResolvedValue({ error: failure });

      await expect(FeedbackService.deleteFeedback('msg-12', 'user-12')).rejects.toThrow(failure);
    });

    it('elimina feedback sin errores', async () => {
      deleteMatchSpy.mockResolvedValue({ error: null });

      await FeedbackService.deleteFeedback('msg-13', 'user-13');

      expect(deleteSpy).toHaveBeenCalled();
      expect(deleteMatchSpy).toHaveBeenCalledWith({
        conversation_message_id: 'msg-13',
        user_id: 'user-13',
      });
    });
  });
});
