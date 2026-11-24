import { devicePlatform } from '@/lib/device';
import { request } from '@/lib/http';
import { apiResponseSchema } from '@/features/shared/schemas/api';
import { appVersionPolicySchema } from '@/features/app-version/schemas/app-version';

/**
 * `GET /mobile/app-version/internal/{platform}` — public: asked before anyone signs in.
 * `internal` is this app; the project's external (customer) app asks `external`, and each
 * has its own minimum on the server.
 */
export async function fetchAppVersionPolicy() {
  const body = await request(`/mobile/app-version/internal/${devicePlatform()}`);
  return apiResponseSchema(appVersionPolicySchema).parse(body);
}
