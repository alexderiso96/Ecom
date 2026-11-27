'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { isCloudinaryImage } from '@/lib/product-images';

type ProductImageProps = Omit<ImageProps, 'src' | 'unoptimized' | 'onError'> & { src: string };

export function ProductImage(props: ProductImageProps) {
  return <ImageSource key={props.src} {...props} />;
}

function ImageSource({ src, alt, ...props }: ProductImageProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  const [failed, setFailed] = useState(false);
  const direct = useOriginal || isCloudinaryImage(src);

  if (failed) {
    return (
      <span role="img" aria-label={`${alt} (immagine non disponibile)`} className="absolute inset-0 grid place-items-center text-stone-500">
        <ImageOff aria-hidden="true" className="h-5 w-5" />
      </span>
    );
  }

  return (
    <Image
      {...props}
      key={direct ? 'original' : 'optimized'}
      src={src}
      alt={alt}
      unoptimized={direct}
      onError={() => {
        if (!direct && /^https:\/\//i.test(src)) setUseOriginal(true);
        else setFailed(true);
      }}
    />
  );
}
