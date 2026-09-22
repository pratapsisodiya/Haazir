import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import WhatItDoes from './components/WhatItDoes'
import Calculator from './components/Calculator'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import CallToAction from './components/CallToAction'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <main>
        <Marquee />
        <WhatItDoes />
        <Calculator />
        <HowItWorks />
        <Pricing />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}
