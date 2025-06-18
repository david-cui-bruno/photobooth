export interface PhotoStrip {
  id: string;
  title: string;
  description?: string;
  imageData: string; // base64 encoded image
  stripType: '2-panel' | '4-panel' | '6-panel';
  frameType: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  author?: string;
  tags?: string[];
}

export interface CreatePhotoStripRequest {
  title: string;
  description?: string;
  imageData: string;
  stripType: '2-panel' | '4-panel' | '6-panel';
  frameType: string;
  author?: string;
  tags?: string[];
}

export interface UpdatePhotoStripRequest {
  title?: string;
  description?: string;
  tags?: string[];
}
