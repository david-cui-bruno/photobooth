import { Request, Response } from 'express';
import { PhotoStripService } from '../services/photoStripService';

const photoStripService = new PhotoStripService();

export const getAllPhotoStrips = async (req: Request, res: Response) => {
  try {
    const photoStrips = await photoStripService.getAllPhotoStrips();
    res.json(photoStrips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photo strips' });
  }
};

export const getPhotoStripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const photoStrip = await photoStripService.getPhotoStripById(id);
    
    if (!photoStrip) {
      return res.status(404).json({ error: 'Photo strip not found' });
    }
    
    res.json(photoStrip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photo strip' });
  }
};

export const createPhotoStrip = async (req: Request, res: Response) => {
  try {
    const photoStrip = await photoStripService.createPhotoStrip(req.body);
    res.status(201).json(photoStrip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create photo strip' });
  }
};

export const updatePhotoStrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const photoStrip = await photoStripService.updatePhotoStrip(id, req.body);
    
    if (!photoStrip) {
      return res.status(404).json({ error: 'Photo strip not found' });
    }
    
    res.json(photoStrip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update photo strip' });
  }
};

export const deletePhotoStrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await photoStripService.deletePhotoStrip(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Photo strip not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo strip' });
  }
};

export const likePhotoStrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const photoStrip = await photoStripService.likePhotoStrip(id);
    
    if (!photoStrip) {
      return res.status(404).json({ error: 'Photo strip not found' });
    }
    
    res.json(photoStrip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to like photo strip' });
  }
};
