import { ConvexReactClient } from 'convex/react';

// Exported so non-React code (e.g. db/queries.ts) can call mutations on the
// same client instance that ConvexProviderWithClerk binds auth to.
// Nullable to match the root layout's defensive handling of missing env.
const url = process.env.EXPO_PUBLIC_CONVEX_URL;

export const convex: ConvexReactClient | null = url
  ? new ConvexReactClient(url, { unsavedChangesWarning: false })
  : null;
