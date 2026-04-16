'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRightIcon, ArrowTrendingUpIcon, ShieldCheckIcon, SparklesIcon,
  ChartBarIcon, BoltIcon, AcademicCapIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import PublicNav from '@/components/PublicNav'

const stats = [
  { label: 'Sharpe ratio (vs S&P 500: 0.93)', value: '0.97' },
  { label: 'Worst drawdown (vs S&P −33.7%)',  value: '−26.5%' },
  { label: 'Simulations that beat the S&P',   value: '79.2%' },
  { label: 'Questions to fit your portfolio', value: '30' },
]

const features = [
  { icon: ShieldCheckIcon, title: 'Risk-first, not return-first',  body: 'We start with what you could lose on your worst day, and design around it. Hierarchical Risk Parity blended with Markowitz optimization, the way institutional funds do it.' },
  { icon: SparklesIcon,    title: 'Built around you', body: 'A 30-question assessment across six dimensions shapes every allocation. Not three pre-baked buckets.' },
  { icon: AcademicCapIcon, title: 'Every move explained', body: 'Plain-English context for every allocation change. No jargon walls between you and your money.' },
  { icon: BoltIcon,        title: 'Paper trade or go live', body: 'Practice without risking a dollar. Connect to Alpaca when you are ready for real trades.' },
]

const steps = [
  { n: '01', title: 'Take the 30-question assessment',    body: 'Six dimensions: risk capacity, tolerance, goals, themes, literacy, time horizon. Takes about two minutes.' },
  { n: '02', title: 'See the portfolio built for you',     body: 'A real mix of stocks, bonds, and alternatives, blended from HRP and Markowitz to fit your profile.' },
  { n: '03', title: 'Paper trade, then go live',   body: 'Try it with simulated dollars first. Connect Alpaca and switch to live trading whenever you are ready.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden">
        {/* ambient glows */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-20 w-[520px] h-[520px] rounded-full blur-3xl opacity-60"
               style={{ background: 'radial-gradient(closest-side, rgba(139,92,246,0.28), transparent)' }} />
          <div className="absolute top-40 -right-20 w-[520px] h-[520px] rounded-full blur-3xl opacity-60"
               style={{ background: 'radial-gradient(closest-side, rgba(0,212,168,0.25), transparent)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-16 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="eyebrow mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100">
              <SparklesIcon className="h-3.5 w-3.5" />
              Institutional-grade investing, for the rest of us
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 leading-[1.02] tracking-[-0.035em]">
              The portfolio that fits<br/>
              <span className="gradient-text">you, not the index.</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-neutral-600 max-w-xl leading-relaxed">
              Most apps tell you to buy the S&amp;P 500 and call it diversification. Hedgewise tells
              you exactly how much you could lose, then builds the portfolio that fits.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="btn-gradient inline-flex items-center justify-center gap-2 px-7 py-4 text-base">
                Get started — free
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link href="/assessment" className="btn-secondary inline-flex items-center justify-center gap-2 px-7 py-4 text-base">
                Try the risk assessment
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-neutral-500">
              <div className="flex -space-x-2">
                {['#A78BFA','#60A5FA','#34D399','#FCD34D'].map(c => (
                  <div key={c} className="w-8 h-8 rounded-full border-2 border-white" style={{ background: c }} />
                ))}
              </div>
              <div>
                <div className="font-semibold text-neutral-900">Open source</div>
                <div className="text-xs">Built at Furman, free to use</div>
              </div>
            </div>
          </motion.div>

          {/* ─────────── Tilted hero card (Apple Card style) ─────────── */}
          <motion.div
            initial={{ opacity: 0, rotate: -4, y: 40 }}
            animate={{ opacity: 1, rotate: -4, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div
              className="rounded-[32px] p-8 text-white relative overflow-hidden shadow-soft-xl"
              style={{
                background:
                  'radial-gradient(ellipse at top left, rgba(255,255,255,0.35), transparent 55%),' +
                  'linear-gradient(135deg, #6D5BF7 0%, #9A6BF5 35%, #4FC4E8 70%, #4ADEA2 100%)',
                backgroundSize: '180% 180%',
                animation: 'aurora 22s ease infinite',
                aspectRatio: '1.58 / 1',
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur border border-white/20"
                >
                  <span className="font-bold">H</span>
                </div>
                <div className="text-sm font-mono opacity-80">HEDGEWISE</div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="text-xs uppercase tracking-[0.14em] opacity-75">Portfolio value</div>
                <div className="text-5xl font-bold tabular mt-1">$128,450.27</div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20">
                    <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                    +8.42%
                  </span>
                  <span className="opacity-70">vs last 30 days</span>
                </div>
              </div>
            </div>

            {/* floating chip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl px-4 py-3 shadow-soft-lg border border-dark-700/60 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-success-100 flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Rebalanced</div>
                <div className="text-xs text-neutral-500">2 min ago</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-3 shadow-soft-lg border border-dark-700/60"
            >
              <div className="caption">Risk score</div>
              <div className="text-xl font-bold text-neutral-900 tabular">6.2 <span className="text-sm text-neutral-400">/ 10</span></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ STATS STRIP ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="card p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-dark-700/60">
          {stats.map((s, i) => (
            <div key={s.label} className={`${i>0 ? 'pt-6 md:pt-0' : ''} md:px-6 first:md:pl-0 last:md:pr-0`}>
              <div className="display-md text-neutral-900 mb-1">{s.value}</div>
              <div className="caption">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Why Hedgewise</div>
          <h2 className="heading-xl text-4xl md:text-5xl mb-5 tracking-[-0.03em]">
            The same methods <span className="gradient-text">Wall Street uses.</span> Without Wall Street.
          </h2>
          <p className="body-lg">
            Hierarchical Risk Parity. Markowitz optimization. Six years of backtesting. Wrapped in
            something you will actually want to use.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="card card-hover p-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="heading-md mb-2">{f.title}</div>
                <div className="body-md">{f.body}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="bg-white border-y border-dark-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl mb-14">
            <div className="eyebrow mb-4">How it works</div>
            <h2 className="heading-xl text-4xl md:text-5xl tracking-[-0.03em]">Three steps. Then your money does the work.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {steps.map(s => (
              <div key={s.n} className="relative p-8 rounded-3xl border border-dark-700/60 bg-dark-950 hover-lift">
                <div className="text-5xl font-bold gradient-text mb-4 tracking-tight">{s.n}</div>
                <div className="heading-md mb-2">{s.title}</div>
                <div className="body-md">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div
          className="rounded-[32px] p-10 md:p-16 text-center relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(255,255,255,0.25), transparent 55%),' +
              'linear-gradient(135deg, #6D5BF7 0%, #9A6BF5 40%, #4FC4E8 80%, #4ADEA2 100%)',
            backgroundSize: '180% 180%',
            animation: 'aurora 22s ease infinite',
          }}
        >
          <div className="relative z-10 max-w-2xl mx-auto text-white">
            <h2 className="display-lg !text-white mb-5 leading-[1.05]">
              Stop guessing.<br/>
              Start investing.
            </h2>
            <p className="text-lg text-white/85 mb-8">
              Free to start. Paper-trade as long as you want. Go live whenever you are ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white text-neutral-900 font-semibold hover:bg-white/90 transition-all shadow-soft-lg">
                Create free account
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
              <Link href="/assessment" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 border border-white/30 backdrop-blur text-white font-semibold hover:bg-white/20 transition-all">
                Take the 2-min assessment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-dark-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5B5BF6 0%, #8B5CF6 55%, #F76343 100%)' }}
            >
              <span className="text-on-dark font-bold text-xs">H</span>
            </div>
            <span className="heading-sm">Hedgewise</span>
          </div>
          <div className="caption">© {new Date().getFullYear()} Hedgewise. Built with care.</div>
          <div className="flex items-center gap-6 caption">
            <a href="#" className="hover:text-neutral-900">Privacy</a>
            <a href="#" className="hover:text-neutral-900">Terms</a>
            <a href="#" className="hover:text-neutral-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
