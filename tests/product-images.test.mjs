import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductImageUrls, isCloudinaryImage } from '../src/lib/product-images.ts';

test('the selected cover leads the gallery without duplicating images', () => {
  assert.deepEqual(getProductImageUrls({
    image_url: ' /cover.jpg ',
    images: ['/other.jpg', '/cover.jpg', '', '/other.jpg'],
  }), ['/cover.jpg', '/other.jpg']);
});

test('products without a cover use the first available gallery image', () => {
  assert.deepEqual(getProductImageUrls({ image_url: null, images: ['/first.jpg'] }), ['/first.jpg']);
  assert.deepEqual(getProductImageUrls({ image_url: null, images: null }), []);
});

test('only recognized Cloudinary delivery URLs bypass the optimizer initially', () => {
  assert.equal(isCloudinaryImage('https://res.cloudinary.com/store/image/upload/v1/cover.jpg'), true);
  assert.equal(isCloudinaryImage('https://res.cloudinary.com.example/image/upload/cover.jpg'), false);
  assert.equal(isCloudinaryImage('/dream-creation/demo/pochette.jpg'), false);
});
