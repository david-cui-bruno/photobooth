import express, { Request, Response } from 'express';
import {
  getAllPhotoStrips,
  getPhotoStripById,
  createPhotoStrip,
  updatePhotoStrip,
  deletePhotoStrip,
  likePhotoStrip
} from '../controllers/photoStripController';

const router = express.Router();

// GET /api/photostrips - Get all photo strips
router.get('/', (req: Request, res: Response) => void getAllPhotoStrips(req, res));

// GET /api/photostrips/:id - Get photo strip by ID
router.get('/:id', (req: Request, res: Response) => void getPhotoStripById(req, res));

// POST /api/photostrips - Create new photo strip
router.post('/', (req: Request, res: Response) => void createPhotoStrip(req, res));

// PUT /api/photostrips/:id - Update photo strip
router.put('/:id', (req: Request, res: Response) => void updatePhotoStrip(req, res));

// DELETE /api/photostrips/:id - Delete photo strip
router.delete('/:id', (req: Request, res: Response) => void deletePhotoStrip(req, res));

// POST /api/photostrips/:id/like - Like a photo strip
router.post('/:id/like', (req: Request, res: Response) => void likePhotoStrip(req, res));

export default router;
