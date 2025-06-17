// Import Chikawa images
import chikawa1 from '../assets/ChiikawaFrame/chikawa1.png';
import chikawa2 from '../assets/ChiikawaFrame/chikawa2.png';
import usagi1 from '../assets/ChiikawaFrame/usagi1.png';

export const generatePhotoStrip = (
  images: string[],
  stripType: string,
  frame: string
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const panelCount = parseInt(stripType.split(' ')[0]);
    const stripWidth = 300;
    const stripHeight = panelCount * 200 + (panelCount - 1) * 10 + 80; // More space for bigger Chikawa overlays
    
    canvas.width = stripWidth;
    canvas.height = stripHeight;
    
    // Frame styles
    const frameStyles: { [key: string]: { bg: string; border: string; borderWidth: number } } = {
      'classic': { bg: '#ffffff', border: '#000000', borderWidth: 4 },
      'vintage': { bg: '#fdf6e3', border: '#8b4513', borderWidth: 6 },
      'modern': { bg: '#f8f9fa', border: '#6c757d', borderWidth: 2 },
      'colorful': { bg: '#ffffff', border: '#007bff', borderWidth: 5 },
      'chikawa': { bg: '#ffe6f2', border: '#ff69b4', borderWidth: 4 },
    };
    
    const frameStyle = frameStyles[frame] || frameStyles['classic'];
    
    // Fill background with frame background color
    ctx.fillStyle = frameStyle.bg;
    ctx.fillRect(0, 0, stripWidth, stripHeight);
    
    // Draw outer frame border
    ctx.strokeStyle = frameStyle.border;
    ctx.lineWidth = frameStyle.borderWidth;
    ctx.strokeRect(
      frameStyle.borderWidth / 2, 
      frameStyle.borderWidth / 2, 
      stripWidth - frameStyle.borderWidth, 
      stripHeight - frameStyle.borderWidth
    );
    
    let loadedImages = 0;
    const imageElements: HTMLImageElement[] = [];
    
    // For Chikawa frame, we need to load the character images too
    const totalImagesToLoad = frame === 'chikawa' ? images.length + 3 : images.length;
    let chikawaImages: { [key: string]: HTMLImageElement } = {};
    
    // Load Chikawa character images if needed
    if (frame === 'chikawa') {
      const chikawaImgs = [
        { name: 'chikawa1', src: chikawa1 },
        { name: 'chikawa2', src: chikawa2 },
        { name: 'usagi1', src: usagi1 }
      ];
      
      chikawaImgs.forEach((chikawaImg) => {
        const img = new Image();
        img.onload = () => {
          chikawaImages[chikawaImg.name] = img;
          loadedImages++;
          checkAllImagesLoaded();
        };
        img.onerror = () => {
          console.error(`Failed to load Chikawa image: ${chikawaImg.name}`);
          loadedImages++;
          checkAllImagesLoaded();
        };
        img.src = chikawaImg.src;
      });
    }
    
    // Load photo images
    images.forEach((imageSrc, index) => {
      const img = new Image();
      img.onload = () => {
        imageElements[index] = img;
        loadedImages++;
        checkAllImagesLoaded();
      };
      img.src = imageSrc;
    });
    
    function checkAllImagesLoaded() {
      if (loadedImages === totalImagesToLoad) {
        // Draw all photos
        imageElements.forEach((img, idx) => {
          const padding = frameStyle.borderWidth + 15;
          const y = padding + idx * (200 + 10);
          const imageWidth = stripWidth - (padding * 2);
          const imageHeight = 180;
          
          // Draw photo
          ctx.drawImage(img, padding, y, imageWidth, imageHeight);
          
          // Draw individual photo borders
          ctx.strokeStyle = frameStyle.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(padding, y, imageWidth, imageHeight);
        });
        
        // Add Chikawa overlays AFTER all photos are drawn (so they appear on top)
        if (frame === 'chikawa') {
          addBigChikawaOverlays(ctx, frameStyle.borderWidth + 15, stripWidth, imageElements.length, chikawaImages);
        }
        
        // Add frame decorations
        addFrameDecorations(ctx, frame, stripWidth, stripHeight, chikawaImages);
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      }
    }
  });
};

const addBigChikawaOverlays = (
  ctx: CanvasRenderingContext2D,
  padding: number,
  stripWidth: number,
  photoCount: number,
  chikawaImages: { [key: string]: HTMLImageElement }
) => {
  const overlaySize = 80; // Much bigger now!
  const imageWidth = stripWidth - (padding * 2);
  
  // Place one character on each photo, but bigger and more prominent
  const characters = [
    { name: 'chikawa1', position: 'top-right' },
    { name: 'usagi1', position: 'top-left' },
    { name: 'chikawa2', position: 'bottom-right' }
  ];
  
  for (let photoIndex = 0; photoIndex < photoCount; photoIndex++) {
    const y = padding + photoIndex * (200 + 10);
    const characterIndex = photoIndex % characters.length;
    const character = characters[characterIndex];
    
    if (chikawaImages[character.name]) {
      let overlayX, overlayY;
      
      // Position based on character assignment
      switch (character.position) {
        case 'top-right':
          overlayX = padding + imageWidth - overlaySize - 15;
          overlayY = y + 15;
          break;
        case 'top-left':
          overlayX = padding + 15;
          overlayY = y + 15;
          break;
        case 'bottom-right':
          overlayX = padding + imageWidth - overlaySize - 15;
          overlayY = y + 180 - overlaySize - 15;
          break;
        case 'bottom-left':
          overlayX = padding + 15;
          overlayY = y + 180 - overlaySize - 15;
          break;
        default:
          overlayX = padding + imageWidth - overlaySize - 15;
          overlayY = y + 15;
      }
      
      // Add white background circle for better visibility
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(overlayX + overlaySize/2, overlayY + overlaySize/2, overlaySize/2 + 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add pink border around the circle
      ctx.strokeStyle = '#ff69b4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(overlayX + overlaySize/2, overlayY + overlaySize/2, overlaySize/2 + 8, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw the Chikawa character (bigger!)
      ctx.drawImage(chikawaImages[character.name], overlayX, overlayY, overlaySize, overlaySize);
    }
  }
};

const addFrameDecorations = (
  ctx: CanvasRenderingContext2D, 
  frame: string, 
  width: number, 
  height: number,
  chikawaImages?: { [key: string]: HTMLImageElement }
) => {
  switch (frame) {
    case 'vintage':
      // Add vintage corner decorations
      ctx.fillStyle = '#8b4513';
      // Top corners
      ctx.fillRect(10, 10, 20, 3);
      ctx.fillRect(10, 10, 3, 20);
      ctx.fillRect(width - 30, 10, 20, 3);
      ctx.fillRect(width - 13, 10, 3, 20);
      // Bottom corners
      ctx.fillRect(10, height - 13, 20, 3);
      ctx.fillRect(10, height - 30, 3, 20);
      ctx.fillRect(width - 30, height - 13, 20, 3);
      ctx.fillRect(width - 13, height - 30, 3, 20);
      break;
      
    case 'colorful':
      // Add colorful dots
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(
          20 + (i * 26), 
          height - 20, 
          4, 
          0, 
          2 * Math.PI
        );
        ctx.fill();
      }
      break;
      
    case 'modern':
      // Add modern minimalist line
      ctx.strokeStyle = '#6c757d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, height - 20);
      ctx.lineTo(width - 20, height - 20);
      ctx.stroke();
      break;
      
    case 'chikawa':
      // Add Chikawa decorations (removed top corner characters)
      if (chikawaImages) {
        const decorSize = 50;
        
        // Only bottom center decoration (removed top left and top right)
        if (chikawaImages['chikawa2']) {
          ctx.drawImage(chikawaImages['chikawa2'], width/2 - decorSize/2, height - decorSize - 15, decorSize, decorSize);
        }
        
        // Add hearts around the frame (keeping these)
        ctx.fillStyle = '#ff69b4';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('♡', 30, 35);
        ctx.fillText('♡', width - 50, 35);
        ctx.fillText('♡', 20, height - decorSize - 25);
        ctx.fillText('♡', width - 35, height - decorSize - 25);
        
        // Add some sparkles
        ctx.font = '20px Arial';
        ctx.fillText('✨', width/4, height - 30);
        ctx.fillText('✨', 3*width/4, height - 30);
      }
      break;
  }
};
