import Link from "next/link";

const NAV = [
  { href: "/", label: "Tonight" },
  { href: "/states", label: "States" },
  { href: "/system", label: "System" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pt-5 sm:px-8">
      <Link href="/" className="type-title text-ink no-underline">
        Tonight, <span className="text-slate-ink">Rendered</span>
      </Link>
      <nav aria-label="Site">
        <ul className="flex gap-1.5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="glass type-label inline-flex min-h-11 items-center rounded-full px-4 text-deep no-underline hover:bg-glass-strong">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1200px] px-4 pb-10 pt-16 sm:px-8">
      <p className="type-caption max-w-[62ch] text-slate-ink">
        An unofficial concept by <a className="text-deep underline underline-offset-2" href="https://hafsausmani.com">Hafsa Usmani</a>. Not affiliated with,
        endorsed by, or built with input from Nirva Labs. Maya is fictional and every line is mock data written for this concept. Typefaces are the ones
        nirva.life uses, from Google Fonts. No Nirva logo, product images, or code.
      </p>
    </footer>
  );
}
