import fs from 'fs/promises';
import path from 'path';
import { PhotoStrip, CreatePhotoStripRequest, UpdatePhotoStripRequest } from '../types/PhotoStrip';

const DATA_FILE = path.join(__dirname, '../../data/photostrips.json');

export class PhotoStripService {
  private async ensureDataFile(): Promise<void> {
    try {
      await fs.access(DATA_FILE);
    } catch {
      // File doesn't exist, create it
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
  }

  private async readData(): Promise<PhotoStrip[]> {
    await this.ensureDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  }

  private async writeData(photoStrips: PhotoStrip[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(photoStrips, null, 2));
  }

  async getAllPhotoStrips(): Promise<PhotoStrip[]> {
    const photoStrips = await this.readData();
    return photoStrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPhotoStripById(id: string): Promise<PhotoStrip | null> {
    const photoStrips = await this.readData();
    return photoStrips.find(strip => strip.id === id) || null;
  }

  async createPhotoStrip(data: CreatePhotoStripRequest): Promise<PhotoStrip> {
    const photoStrips = await this.readData();
    
    const newPhotoStrip: PhotoStrip = {
      id: this.generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0
    };

    photoStrips.push(newPhotoStrip);
    await this.writeData(photoStrips);
    
    return newPhotoStrip;
  }

  async updatePhotoStrip(id: string, data: UpdatePhotoStripRequest): Promise<PhotoStrip | null> {
    const photoStrips = await this.readData();
    const index = photoStrips.findIndex(strip => strip.id === id);
    
    if (index === -1) return null;
    
    photoStrips[index] = {
      ...photoStrips[index],
      ...data,
      updatedAt: new Date()
    };
    
    await this.writeData(photoStrips);
    return photoStrips[index];
  }

  async deletePhotoStrip(id: string): Promise<boolean> {
    const photoStrips = await this.readData();
    const initialLength = photoStrips.length;
    const filteredStrips = photoStrips.filter(strip => strip.id !== id);
    
    if (filteredStrips.length === initialLength) return false;
    
    await this.writeData(filteredStrips);
    return true;
  }

  async likePhotoStrip(id: string): Promise<PhotoStrip | null> {
    const photoStrips = await this.readData();
    const index = photoStrips.findIndex(strip => strip.id === id);
    
    if (index === -1) return null;
    
    photoStrips[index].likes += 1;
    photoStrips[index].updatedAt = new Date();
    
    await this.writeData(photoStrips);
    return photoStrips[index];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
