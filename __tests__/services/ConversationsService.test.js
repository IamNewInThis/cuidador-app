jest.mock('../../src/lib/supabase', () => ({
  from: jest.fn(),
  insert: jest.fn(),
  select: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
}));

import ConversationsService from '../../src/services/ConversationsService';
import supabase from '../../src/lib/supabase';

describe('ConversationsService', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    supabase.from.mockReturnValue(supabase);
    supabase.insert.mockImplementation(() => supabase);
    supabase.select.mockImplementation(() => supabase);
    supabase.order.mockImplementation(() => supabase);
    supabase.limit.mockImplementation(() => Promise.resolve({ data: [], error: null }));
    supabase.eq.mockImplementation(() => supabase);
    supabase.single.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  });

  describe('createMessage', () => {
    it('persiste un mensaje y retorna la fila insertada', async () => {
      const inserted = { id: 'msg1' };
      supabase.single.mockReturnValueOnce(Promise.resolve({ data: inserted, error: null }));

      const payload = { userId: 'user-123', babyId: 'baby-1', content: 'hola', role: 'user' };
      const response = await ConversationsService.createMessage(payload);

      expect(supabase.from).toHaveBeenCalledWith('conversations');
      expect(supabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user-123',
          baby_id: 'baby-1',
          content: 'hola',
          role: 'user',
        }),
      ]);
      expect(response).toEqual(inserted);
    });

    it('lanza el error cuando supabase falla', async () => {
      const error = new Error('insert fail');
      supabase.single.mockReturnValueOnce(Promise.reject(error));

      await expect(
        ConversationsService.createMessage({ userId: 'user-123', content: 'hola', role: 'user' })
      ).rejects.toThrow(error);
    });
  });

  describe('getConversationHistory', () => {
    it('recupera historial ordenado', async () => {
      const rows = [{ id: '1' }, { id: '2' }];
      supabase.limit.mockReturnValueOnce(Promise.resolve({ data: rows, error: null }));

      const response = await ConversationsService.getConversationHistory(10);

      expect(supabase.from).toHaveBeenCalledWith('conversations');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(supabase.limit).toHaveBeenCalledWith(10);
      expect(response).toEqual(rows);
    });

    it('propaga el error si supabase rechaza', async () => {
      const error = new Error('fetch fail');
      supabase.limit.mockReturnValueOnce(Promise.reject(error));

      await expect(ConversationsService.getConversationHistory()).rejects.toThrow(error);
    });
  });

  describe('getConversationsByBaby', () => {
    it('filtra por baby_id y limita resultados', async () => {
      const rows = [{ id: '1' }];
      supabase.limit.mockReturnValueOnce(Promise.resolve({ data: rows, error: null }));

      const response = await ConversationsService.getConversationsByBaby('baby-1', 5);

      expect(supabase.from).toHaveBeenCalledWith('conversations');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('baby_id', 'baby-1');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(supabase.limit).toHaveBeenCalledWith(5);
      expect(response).toEqual(rows);
    });

    it('lanza error si supabase falla', async () => {
      const error = new Error('filter fail');
      supabase.limit.mockReturnValueOnce(Promise.reject(error));

      await expect(ConversationsService.getConversationsByBaby('baby-1')).rejects.toThrow(error);
    });
  });
});
