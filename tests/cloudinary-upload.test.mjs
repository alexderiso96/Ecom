import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadCloudinaryImage } from '../src/lib/cloudinary-upload.ts';

const target = {
  provider: 'cloudinary',
  endpoint: 'https://api.cloudinary.com/v1_1/demo/image/upload',
  fields: { timestamp: '173719931', signature: 'signature-test' },
};
const file = new File(['test fixture'], 'photo.jpg', { type: 'image/jpeg' });

test('sends the photo and signed fields as multipart data and returns the gallery URL', async (context) => {
  const url = 'https://res.cloudinary.com/demo/image/upload/photo.jpg';
  context.mock.method(globalThis, 'fetch', async (endpoint, init) => {
    assert.equal(endpoint, target.endpoint);
    assert.equal(init.method, 'POST');
    assert.equal(init.body.get('file').name, 'photo.jpg');
    assert.equal(init.body.get('signature'), 'signature-test');
    return Response.json({ secure_url: url });
  });
  assert.equal(await uploadCloudinaryImage(file, target), url);
});

test('reports the upload rejection without including the signing payload', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { message: 'Invalid Signature. String to sign - sensitive-payload' },
  }, { status: 401 }));
  await assert.rejects(uploadCloudinaryImage(file, target), {
    message: 'Cloudinary (HTTP 401): Invalid Signature.',
  });
});

test('rejects an upload response without an HTTPS image URL', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({}));
  await assert.rejects(uploadCloudinaryImage(file, target), /senza un URL immagine HTTPS/);
});
