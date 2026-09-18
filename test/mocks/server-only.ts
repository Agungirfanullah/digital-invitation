// Test-only stand-in for the `server-only` package.
//
// `server-only`'s real implementation unconditionally throws — it relies on
// Next.js's webpack `react-server` module condition to swap in a no-op for
// server bundles, not a runtime `typeof window` check. Vitest runs outside
// that bundler pipeline, so importing the real package here would throw on
// every test that transitively imports a server-only module. This alias
// (see vitest.config.ts) keeps the marker meaningful in application code
// while letting server-only modules be unit tested.
export {};
