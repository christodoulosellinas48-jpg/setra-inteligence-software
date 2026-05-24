import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MarketingHeader from '@/components/layout/MarketingHeader';
import { Check, Users, FileText, Download, Palette, Eye, Mail } from 'lucide-react';

const BENEFITS = [
  {
    icon: Users,
    title: 'Every client. One screen.',
    description: 'See all your restaurant clients in a single dashboard — last sync, VAT due, audit status, pending actions. Filter by deadline this week.',
  },
  {
    icon: FileText,
    title: 'Bulk VAT packs in one batch',
    description: 'Select multiple clients and generate Q-period VAT packs simultaneously. No switching between tabs or logging into each system separately.',
  },
  {
    icon: Download,
    title: 'Scheduled monthly P&L delivery',
    description: 'Set a monthly send date per client. Setra automatically sends the P&L to the operator on the Xth of each month — signed off by your firm.',
  },
  {
    icon: Palette,
    title: 'White-label ready',
    description: 'Upload your accounting firm logo. It replaces the Setra wordmark in the portal header and appears in all scheduled email signatures.',
  },
  {
    icon: Eye,
    title: 'Read-only client view',
    description: 'Switch into any client\'s operator view to see exactly what they see. Read-only — no edits, no posting. "← Back to portfolio" always visible.',
  },
  {
    icon: FileText,
    title: 'Bulk audit export',
    description: 'Export PDF audit packs for multiple clients in one ZIP. Email directly to clients from the portal or download for your own records.',
  },
];

const STARS = Array.from({ length: 60 }, (_, i) => ({
  left: `${(i * 43 + 7) % 100}%`,
  top: `${(i * 59 + 11) % 100}%`,
  opacity: ((i % 5) * 0.08) + 0.1,
}));

export default function Accountants() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A14] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f2e] via-[#0A0A14] to-[#0A0A14]" />
        {STARS.map((star, i) => (
          <div key={i} className="absolute w-1 h-1 bg-purple-400 rounded-full" style={star} />
        ))}
      </div>

      <MarketingHeader />

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7B3BFF]/15 border border-[#7B3BFF]/30 text-[#C084FC] text-xs font-medium mb-6">
              For accounting firms & bookkeepers
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              One screen for every
              <br />
              <span className="bg-gradient-to-r from-[#7B3BFF] via-[#A855F7] to-[#C084FC] bg-clip-text text-transparent">
                restaurant client.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Setra hands you the audit, the Cyprus VAT pack, and the P&L — for all of your hospitality clients, on schedule.
              No chasing, no manual exports, no switching between systems.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                className="px-8 py-6 text-base bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] hover:shadow-[0_0_30px_rgba(123,59,255,0.5)] transition-all"
                onClick={() => navigate('/Dashboard')}
              >
                Become a partner firm
              </Button>
              <a
                href="mailto:chris@setra.app"
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                or email chris@setra.app
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What you get */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Everything your firm needs</h2>
            <p className="text-slate-400">Built for accountants who manage multiple hospitality clients.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-[#151528]/60 backdrop-blur-xl border-[#7B3BFF]/20 p-6 h-full hover:border-[#7B3BFF]/40 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/15 border border-[#7B3BFF]/25 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#C084FC]" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{benefit.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-16 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Setup is three emails</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { step: '01', title: 'Email us', desc: 'We provision your firm-level account — your branding, your clients, your portal. Done same day.' },
              { step: '02', title: 'Email your clients', desc: 'Each client gets their own Setra workspace. They manage day-to-day; you get read access and scheduled exports.' },
              { step: '03', title: 'Email Chris if anything\'s not running', desc: 'On day 30 if a VAT pack hasn\'t auto-generated or a P&L delivery missed, email Chris directly. Not a ticket. A reply.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B3BFF]/30 to-[#A855F7]/20 border border-[#7B3BFF]/40 flex items-center justify-center flex-shrink-0 text-[#C084FC] font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Ready to streamline your practice?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              We're onboarding a small number of accounting firms in Cyprus and Europe. Partner spots are limited during beta.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button
                className="px-8 py-6 text-base bg-gradient-to-r from-[#7B3BFF] to-[#A855F7] hover:shadow-[0_0_30px_rgba(123,59,255,0.5)] transition-all"
                onClick={() => navigate('/Dashboard')}
              >
                Become a partner firm
              </Button>
              <a
                href="mailto:chris@setra.app"
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                or email chris@setra.app
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {['No setup fees', 'White-label included', 'Cyprus VAT TAXISnet ready', 'Dedicated onboarding'].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}