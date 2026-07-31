import { cn } from "@/lib/utils";
import { ImageCropData } from "./admin/ImageCropperDialog";

interface CroppedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  metadata?: ImageCropData;
  containerClassName?: string;
}

export const CroppedImage = ({ metadata, className, containerClassName, style, src, alt, ...props }: CroppedImageProps) => {
  const hasAspect = containerClassName?.includes('aspect-');

  if (!metadata || !metadata.croppedAreaPercentages) {
    if (hasAspect) {
      return (
        <div className={cn("overflow-hidden relative", containerClassName)}>
          <img
            src={src}
            alt={alt}
            className={cn("absolute w-full h-full object-cover", className)}
            style={style}
            {...props}
          />
        </div>
      );
    }
    return (
      <div className={cn("overflow-hidden", containerClassName)}>
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full object-cover", className)}
          style={style}
          {...props}
        />
      </div>
    );
  }

  const { x, y, width, height } = metadata.croppedAreaPercentages;

  return (
    <div className={cn("overflow-hidden relative", containerClassName, className)}>
      <img
        src={src}
        alt={alt}
        className="absolute"
        style={{
          width: `${(100 / width) * 100}%`,
          height: `${(100 / height) * 100}%`,
          left: `${-x / width * 100}%`,
          top: `${-y / height * 100}%`,
          maxWidth: 'none',
          ...style,
        }}
        {...props}
      />
    </div>
  );
};
