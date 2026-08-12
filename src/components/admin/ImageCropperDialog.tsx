import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export interface ImageCropData {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPercentages: { x: number; y: number; width: number; height: number } | null;
  focus: { x: number; y: number };
  alt?: string;
  alt_zhtw?: string;
  alt_zhcn?: string;
}

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  initialData?: ImageCropData | null;
  onSave: (cropData: ImageCropData) => void;
}

export const ImageCropperDialog = ({
  open,
  onOpenChange,
  imageUrl,
  initialData,
  onSave,
}: ImageCropperDialogProps) => {
  const [crop, setCrop] = useState(initialData?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialData?.zoom || 1);
  const [croppedAreaPercentages, setCroppedAreaPercentages] = useState<{ x: number; y: number; width: number; height: number } | null>(initialData?.croppedAreaPercentages || null);

  const onCropComplete = useCallback((croppedArea: { x: number; y: number; width: number; height: number }, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPercentages(croppedArea);
  }, []);

  const handleSave = () => {
    // Calculate focus point based on crop center
    const focusX = croppedAreaPercentages ? croppedAreaPercentages.x + croppedAreaPercentages.width / 2 : 50;
    const focusY = croppedAreaPercentages ? croppedAreaPercentages.y + croppedAreaPercentages.height / 2 : 50;

    onSave({
      crop,
      zoom,
      croppedAreaPercentages,
      focus: { x: focusX, y: focusY },
      alt: initialData?.alt,
      alt_zhtw: initialData?.alt_zhtw,
      alt_zhcn: initialData?.alt_zhcn,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop & Adjust Focus</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 bg-black rounded-md overflow-hidden min-h-[300px]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9} // Allow changing if needed, but 16/9 is good for headers
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Zoom</Label>
            <Slider
              value={[zoom]}
              min={0.5}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Crop & Focus</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
