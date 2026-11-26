import * as z from 'zod';

/** `GET /mobile/app-version/internal/{platform}` — the oldest version allowed to run, and where to update. */
export const appVersionPolicySchema = z.object({
  minimum_version: z.string().nullable(),
  store_url: z.string().nullable(),
});

export type AppVersionPolicy = z.infer<typeof appVersionPolicySchema>;
