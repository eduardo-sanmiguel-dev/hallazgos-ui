import { forwardRef, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  alt: string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

// Original API/file URLs preserve authenticated evidence, blobs and signatures.
const AppImage = forwardRef<HTMLImageElement, Props>(function AppImage(
  { alt, fill, priority, unoptimized: _unoptimized, style, loading, ...props },
  ref,
) {
  return (
    <img
      ref={ref}
      alt={alt}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : undefined}
      style={{
        ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : {}),
        ...style,
      }}
      {...props}
    />
  );
});
export default AppImage;
