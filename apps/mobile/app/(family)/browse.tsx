// Directly render the BrowseNursesScreen component rather than using <Redirect>
// or router.replace() — cross-group navigation from (family) to (public) via
// routing primitives crashes the app or switches to the Nexus Launcher.
// By importing the component directly, we stay within the (family) tab context
// while rendering the same browse UI.
import BrowseNursesScreen from '../(public)/nurses/index';

export default function BrowseTab() {
  return <BrowseNursesScreen />;
}
