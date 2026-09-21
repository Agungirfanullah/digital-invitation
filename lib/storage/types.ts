/**
 * The provider abstraction ARCHITECTURE.md §23 asks for (`lib/storage/`,
 * same shape as `lib/invitation-delivery/`'s `InvitationDeliveryProvider`)
 * — business logic (lib/editor/service.ts) depends on this interface, not
 * on `@supabase/supabase-js` directly.
 */
export interface StorageProvider {
  /** Uploads `body` to `path` within the configured bucket. Returns the public URL. Never accepts a client-supplied path — callers must build it via lib/storage/paths.ts. */
  upload(path: string, body: Buffer, contentType: string): Promise<{ publicUrl: string }>;
  /** Removes the object at `path`. A no-op (does not throw) if the object doesn't exist. */
  remove(path: string): Promise<void>;
}
