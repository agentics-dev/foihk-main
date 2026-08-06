import { cn } from "@/lib/utils";
import { optimizeArticleImageUrl } from "@/lib/utils";
import { ImageCropData } from "./admin/ImageCropperDialog";

interface CroppedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  metadata?: ImageCropData;
  containerClassName?: string;
}

export const CroppedImage = ({ metadata, className, containerClassName, style, src, alt, onError, loading, decoding, ...props }: CroppedImageProps) => {
  const hasAspect = containerClassName?.includes('aspect-');
  const optimizedSrc = typeof src === "string" ? optimizeArticleImageUrl(src, 900) : src;
  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (event.currentTarget.getAttribute("src") !== "/og-image.png") {
      event.currentTarget.src = "/og-image.png";
    }
    onError?.(event);
  };

  if (!metadata || !metadata.croppedAreaPercentages) {
    if (hasAspect) {
      return (
        <div className={cn("overflow-hidden relative", containerClassName)}>
          <img
            src={optimizedSrc}
            alt={alt}
            width="900"
            height="506"
            loading={loading ?? "lazy"}
            decoding={decoding ?? "async"}
            onError={handleError}
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
          src={optimizedSrc}
          alt={alt}
          loading={loading ?? "lazy"}
          decoding={decoding ?? "async"}
          onError={handleError}
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
        src={optimizedSrc}
        alt={alt}
        width="900"
        height="506"
        loading={loading ?? "lazy"}
        decoding={decoding ?? "async"}
        onError={handleError}
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
