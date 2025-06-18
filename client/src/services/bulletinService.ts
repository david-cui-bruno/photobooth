import type { PhotoStrip, CreatePhotoStripRequest, UpdatePhotoStripRequest } from '../types/PhotoStrip';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class BulletinService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAllPhotoStrips(): Promise<PhotoStrip[]> {
    return this.request<PhotoStrip[]>('/photostrips');
  }

  async getPhotoStripById(id: string): Promise<PhotoStrip> {
    return this.request<PhotoStrip>(`/photostrips/${id}`);
  }

  async createPhotoStrip(data: CreatePhotoStripRequest): Promise<PhotoStrip> {
    return this.request<PhotoStrip>('/photostrips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePhotoStrip(id: string, data: UpdatePhotoStripRequest): Promise<PhotoStrip> {
    return this.request<PhotoStrip>(`/photostrips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePhotoStrip(id: string): Promise<void> {
    await this.request(`/photostrips/${id}`, {
      method: 'DELETE',
    });
  }

  async likePhotoStrip(id: string): Promise<PhotoStrip> {
    return this.request<PhotoStrip>(`/photostrips/${id}/like`, {
      method: 'POST',
    });
  }
}

export const bulletinService = new BulletinService();
