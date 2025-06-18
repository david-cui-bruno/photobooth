export const sharePhotoStrip = async (imageDataUrl: string) => {
  if (navigator.share && navigator.canShare) {
    try {
      const blob = await fetch(imageDataUrl).then(r => r.blob());
      const file = new File([blob], 'photostrip.jpg', { type: 'image/jpeg' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Check out my AI PhotoBooth strip!',
          files: [file]
        });
      } else {
        // Fallback to sharing URL
        await navigator.share({
          title: 'Check out my AI PhotoBooth strip!',
          text: 'Made with AI-powered face detection and auto-capture!'
        });
      }
    } catch (error) {
      console.log('Sharing failed:', error);
      downloadImage(imageDataUrl);
    }
  } else {
    // Fallback: download the image
    downloadImage(imageDataUrl);
  }
};

const downloadImage = (imageDataUrl: string) => {
  const link = document.createElement('a');
  link.download = 'ai-photostrip.jpg';
  link.href = imageDataUrl;
  link.click();
};
