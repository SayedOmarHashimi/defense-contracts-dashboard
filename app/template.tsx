/**
 * A template re-mounts on every navigation, which is what makes this a route
 * transition rather than a one-time page load animation. Entrance only: exit
 * animations in the App Router need AnimatePresence workarounds that interfere
 * with scroll restoration, and they delay the next page for no real gain.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
