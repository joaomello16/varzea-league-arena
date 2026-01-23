import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSource: string;
  aspectRatio?: number;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  title?: string;
}

export function ImageCropper({
  imageSource,
  aspectRatio = 1,
  onCropComplete,
  onCancel,
  title = 'Cortar Imagem',
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChangeCallback = useCallback((crop: any) => {
    setCrop(crop);
  }, []);

  const onZoomChangeCallback = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    const canvas = document.createElement('canvas');
    const image = new Image();
    image.src = imageSource;

    image.onload = () => {
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            onCropComplete(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      });
    };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card-base w-full max-w-2xl relative">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors z-10"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">
            {title}
          </h2>

          {/* Crop Area */}
          <div className="relative w-full h-80 mb-4 rounded-lg overflow-hidden border border-border">
            <Cropper
              image={imageSource}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChangeCallback}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={onZoomChangeCallback}
            />
          </div>

          {/* Zoom Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCrop}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Confirmar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost flex-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
