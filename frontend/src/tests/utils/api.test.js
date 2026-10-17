import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../../api.js';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch.mockClear();
  });

  it('should make GET request', async () => {
    const mockResponse = { data: 'test' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should include auth token when available', async () => {
    localStorage.getItem.mockReturnValue('test-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    await api.get('/protected');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
  });

  it('should throw error on failed request', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Request failed' })
    });

    await expect(api.get('/fail')).rejects.toThrow('Request failed');
  });

  it('should make POST request with body', async () => {
    const postData = { name: 'Test' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1 })
    });

    await api.post('/create', postData);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData)
      })
    );
  });
});
