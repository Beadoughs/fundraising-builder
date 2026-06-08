import { cn } from "@/lib/utils";
import Image from "next/image";

type SafeImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
};

export function SafeImage({ src, alt, className, fill }: SafeImageProps) {
  if (src.startsWith("data:")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(
          fill && "absolute inset-0 h-full w-full object-cover",
          className
        )}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      unoptimized
      className={className}
    />
  );
}
