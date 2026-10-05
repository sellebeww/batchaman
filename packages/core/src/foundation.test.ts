import { expect, test } from 'vitest';
import { DOMAIN_VERSION } from './index';
test('domain schema version is explicit', () => expect(DOMAIN_VERSION).toBe(1));
