import { JharokhaArch, PrimaryCTA } from './Brand'

export default function CallToAction() {
  return (
    <section className="bg-paper px-5 pt-6 pb-20 sm:px-8 sm:pb-28">
      <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[2rem] border border-line bg-stone px-6 py-20 text-center lift sm:px-10 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 grid-bg grid-mask-panel opacity-70"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[36rem]">
          <JharokhaArch className="mx-auto h-14 w-14 text-clay" />

          <h2 className="mt-8 text-[clamp(2.1rem,5.4vw,3.4rem)]">
            Send us the last enquiry you missed.
          </h2>
          <p className="mt-6 text-ink/65">
            Screenshot it, forward it, or just tell us what happened. We'll reply with
            what the agent would have said — and what it would take to build.
          </p>

          <div className="mt-9 flex justify-center">
            <PrimaryCTA context="missed" className="px-7 py-4">Message haazir on WhatsApp</PrimaryCTA>
          </div>

          <p className="mt-6 text-[0.88rem] text-ink/60">
            We answer in Hindi or English, usually within the hour.
          </p>
        </div>
      </div>
    </section>
  )
}
