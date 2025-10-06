jest.mock('../../src/lib/supabase', () => ({
  from: jest.fn(),
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  single: jest.fn(),
}));

import { getBabies, createBaby, updateBaby, deleteBaby } from '../../src/services/BabiesService';
import supabase from '../../src/lib/supabase';

describe('BabiesService', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    supabase.from.mockReturnValue(supabase);
    supabase.select.mockImplementation(() => supabase);
    supabase.eq.mockImplementation(() => supabase);
    supabase.order.mockImplementation(() => Promise.resolve({ data: [], error: null }));
    supabase.insert.mockImplementation(() => Promise.resolve({ data: [], error: null }));
    supabase.update.mockImplementation(() => supabase);
    supabase.delete.mockImplementation(() => supabase);
    supabase.single.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  });

  describe('getBabies', () => {
    it('retorna la lista ordenada de bebés del usuario', async () => {
      const babies = [{ id: 'b1' }];
      supabase.order.mockReturnValueOnce(Promise.resolve({ data: babies, error: null }));

      const result = await getBabies('user-123');

      expect(result).toEqual({ data: babies, error: null });
      expect(supabase.from).toHaveBeenCalledWith('babies');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('captura el error cuando supabase rechaza', async () => {
      const error = new Error('boom');
      supabase.order.mockReturnValueOnce(Promise.reject(error));

      const result = await getBabies('user-123');

      expect(result.error).toBe(error);
    });
  });

  describe('createBaby', () => {
    it('inserta un nuevo bebé con estructuras por defecto', async () => {
      const inserted = [{ id: 'new-baby' }];
      supabase.insert.mockReturnValueOnce(Promise.resolve({ data: inserted, error: null }));

      const input = { name: 'Lumi', routines: null, preferences: null };
      const result = await createBaby('user-123', input);

      expect(supabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user-123',
          name: 'Lumi',
          routines: {},
          preferences: {},
        }),
      ]);
      expect(result).toEqual({ data: inserted, error: null });
    });

    it('devuelve error cuando supabase falla', async () => {
      const error = new Error('insert fail');
      supabase.insert.mockReturnValueOnce(Promise.reject(error));

      const result = await createBaby('user-123', { name: 'Test' });

      expect(result.error).toBe(error);
    });
  });

  describe('updateBaby', () => {
    it('actualiza y retorna el bebé actualizado', async () => {
      const updated = { id: 'baby' };
      supabase.single.mockReturnValueOnce(Promise.resolve({ data: updated, error: null }));

      const result = await updateBaby('user-123', 'baby', { name: 'Nuevo Nombre' });

      expect(supabase.update).toHaveBeenCalledWith({
        name: 'Nuevo Nombre',
        birthdate: null,
        gender: null,
        weight: null,
        height: null,
        routines: null,
        preferences: null,
      });
      expect(supabase.eq).toHaveBeenNthCalledWith(1, 'id', 'baby');
      expect(supabase.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-123');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(result).toEqual({ data: updated, error: null });
    });

    it('propaga el error de supabase', async () => {
      const error = new Error('update fail');
      supabase.single.mockReturnValueOnce(Promise.resolve({ data: null, error }));

      const result = await updateBaby('user-123', 'baby', {});

      expect(result.error).toBe(error);
    });
  });

  describe('deleteBaby', () => {
    it('elimina el bebé y retorna error null', async () => {
      supabase.eq
        .mockReturnValueOnce(supabase)
        .mockReturnValueOnce(Promise.resolve({ error: null }));

      const result = await deleteBaby('user-123', 'baby');

      expect(supabase.from).toHaveBeenCalledWith('babies');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenNthCalledWith(1, 'id', 'baby');
      expect(supabase.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-123');
      expect(result).toEqual({ error: null });
    });

    it('propaga error al eliminar', async () => {
      const error = new Error('delete fail');
      supabase.eq
        .mockReturnValueOnce(supabase)
        .mockReturnValueOnce(Promise.reject(error));

      const result = await deleteBaby('user-123', 'baby');

      expect(result.error).toBe(error);
    });
  });
});
