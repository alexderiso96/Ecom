import assert from 'node:assert/strict';
import test from 'node:test';
import { getCloudinaryConfig, signProductImageUpload } from '../src/lib/cloudinary.ts';

test('missing Cloudinary settings preserve the Supabase Storage fallback', () => {
  assert.equal(getCloudinaryConfig({}), null);
  assert.throws(() => getCloudinaryConfig({ CLOUDINARY_CLOUD_NAME: 'dream-test' }), /incompleta/);
  assert.throws(() => getCloudinaryConfig({
    CLOUDINARY_CLOUD_NAME: 'invalid/name',
    CLOUDINARY_API_KEY: 'key-test',
    CLOUDINARY_API_SECRET: 'secret-test',
  }), /non valida/);
});

test('product images get a SHA-256 signature for a unique non-overwriting upload', () => {
  const config = getCloudinaryConfig({
    CLOUDINARY_CLOUD_NAME: ' dream-test ',
    CLOUDINARY_API_KEY: 'key-test',
    CLOUDINARY_API_SECRET: 'secret-test',
    CLOUDINARY_UPLOAD_PRESET: 'products-test',
  });
  const target = signProductImageUpload(config, 'test-id', 173719931);
  assert.deepEqual(target, {
    provider: 'cloudinary',
    endpoint: 'https://api.cloudinary.com/v1_1/dream-test/image/upload',
    fields: {
      overwrite: 'false',
      public_id: 'dream-creation/products/test-id',
      timestamp: '173719931',
      upload_preset: 'products-test',
      api_key: 'key-test',
      signature: '4344f823eef278a0c95b0c7848ae655bfc56161e77538a5f2934417f65c3e973',
    },
  });
  assert.doesNotMatch(JSON.stringify(target), /secret-test/);
});
