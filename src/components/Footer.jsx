import { Wordmark } from './Brand'
import { EMAIL, LOCATION } from '../lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Wordmark size={32} />
          <p className="text-[0.92rem] text-ink/45">Haazir &middot; {LOCATION}</p>
        </div>

        <a
          href={`mailto:${EMAIL}`}
          className="text-[0.95rem] text-ink/60 underline decoration-line underline-offset-4 transition-colors hover:text-clay hover:decoration-clay"
        >
          {EMAIL}
        </a>
      </div>
    </footer>
  )
}
