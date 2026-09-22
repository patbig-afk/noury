import Link from "next/link";

const TABS = [
  { href: "/", label: "➕ Saisir" },
  { href: "/depenses", label: "📋 Dépenses" },
] as const;

export function Nav({ current }: { current?: (typeof TABS)[number]["href"] }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <nav className="flex gap-1 rounded-lg bg-stone-200 p-1 text-sm font-medium">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.href === current ? "page" : undefined}
            className="rounded-md px-3 py-1.5 text-stone-600 aria-[current=page]:bg-white aria-[current=page]:text-stone-900 aria-[current=page]:shadow-sm"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
