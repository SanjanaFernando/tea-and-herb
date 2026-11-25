/** Re-mounts on every navigation, giving each page a curtain wipe + rise-in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-transition">{children}<div className="curtain" aria-hidden="true" /></div>;
}
