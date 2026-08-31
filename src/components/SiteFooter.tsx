export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-muted sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Zeus. Built for better setups.</p>
      </div>
    </footer>
  );
}
