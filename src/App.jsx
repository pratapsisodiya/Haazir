import ScrollProgress from './components/ScrollProgress'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import WhatItDoes from './components/WhatItDoes'
import Conversation from './components/Conversation'
import Calculator from './components/Calculator'
import HowItWorks from './components/HowItWorks'
import Comparison from './components/Comparison'
import Pricing from './components/Pricing'
import Faq from './components/Faq'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <Hero />
      <main>
        <Marquee />
        <WhatItDoes />
        {/* Describe it, then show it working, then price it. */}
        <Conversation />
        <Calculator />
        <HowItWorks />
        <Comparison />
        <Pricing />
        <Faq />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}
