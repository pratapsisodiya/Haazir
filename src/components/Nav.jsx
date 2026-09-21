import { PrimaryCTA, Wordmark } from './Brand'

const links = [
  { label: 'What it does', href: '#what-it-does' },
  { label: 'The cost', href: '#calculator' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Nav() {
  return (
    <header className="relative z-20">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-6 sm:px-8">
        <a href="#top" className="flex items-center" aria-label="haazir — home">
          <Wordmark tone="light" size={32} />
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[0.94rem] text-paper/60 transition-colors hover:text-paper"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <PrimaryCTA className="hidden px-5 py-2.5 text-[0.9rem] sm:inline-flex">
          Talk to us
        </PrimaryCTA>
      </nav>
    </header>
  )
}
