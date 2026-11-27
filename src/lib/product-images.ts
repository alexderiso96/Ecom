interface ProductImages {
  image_url?: string | null;
  images?: string[] | null;
}

export function getProductImageUrls(product: ProductImages): string[] {
  return Array.from(new Set(
    [product.image_url, ...(Array.isArray(product.images) ? product.images : [])]
      .flatMap((url) => typeof url === 'string' && url.trim() ? [url.trim()] : []),
  ));
}

export function isCloudinaryImage(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\//i.test(url);
}
