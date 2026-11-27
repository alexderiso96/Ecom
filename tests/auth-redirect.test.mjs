import assert from 'node:assert/strict';
import test from 'node:test';
import { safeInternalPath } from '../src/lib/auth-redirect.ts';

test('preserves valid application destinations', () => {
  assert.equal(safeInternalPath('/admin/orders?status=confirmed#results'), '/admin/orders?status=confirmed#results');
  assert.equal(safeInternalPath('/catalog?q=filo%20oro'), '/catalog?q=filo%20oro');
});

test('rejects destinations outside the application', () => {
  for (const destination of [null, '', '//example.com', 'https://example.com', 'javascript:void(0)', '/\\example.com', '/%2Fexample.com']) {
    assert.equal(safeInternalPath(destination), null);
  }
});
