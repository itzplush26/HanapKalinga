import { Redirect } from 'expo-router';

export default function BrowseTab() {
  // Use <Redirect> instead of imperative router.replace to ensure Expo Router
  // properly resolves the cross-group navigation from (family) to (public).
  // The browse screen lives at (public)/nurses/index.tsx and is always rendered
  // unconditionally including its search input (testID: browse_input_search).
  return <Redirect href="/(public)/nurses" />;
}
