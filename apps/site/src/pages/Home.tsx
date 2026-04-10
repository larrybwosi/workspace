import React from 'react';
import { RefreshCcw, Zap, Lock, Code2, ShieldCheck, Globe2, Database, Cloud, CheckCircle2, Menu } from 'lucide-react';

const Navbar = () => (
  <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
    <div className="flex items-center gap-12">
      <div className="font-bold text-2xl tracking-tight text-gray-900">Skryme</div>
      <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
        <a href="#" className="hover:text-gray-900">
          Product
        </a>
        <a href="#" className="hover:text-gray-900">
          Features
        </a>
        <a href="#" className="hover:text-gray-900">
          Pricing
        </a>
        <a href="#" className="hover:text-gray-900">
          Resources
        </a>
      </div>
    </div>
    <div className="hidden md:flex items-center gap-6 text-sm font-medium">
      <a href="#" className="text-gray-600 hover:text-gray-900">
        Log in
      </a>
      <button className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg transition-colors">
        Get Started
      </button>
    </div>
    <button className="md:hidden text-gray-600">
      <Menu size={24} />
    </button>
  </nav>
);

const Hero = () => (
  <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-wide uppercase mb-6 border border-emerald-100">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        New available for enterprise
      </div>
      <h1 className="text-5xl md:text-[64px] leading-[1.1] font-bold text-gray-900 mb-6 tracking-tight">
        Collaborate <br /> without limits.
      </h1>
      <p className="text-lg text-gray-500 mb-8 max-w-md leading-relaxed">
        The high-performance platform for teams that demand excellence. Synchronize global workflows with zero latency
        and enterprise security.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-medium transition-colors text-center">
          Start Building
        </button>
        <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors text-center">
          View Demo
        </button>
      </div>
    </div>
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-transparent rounded-[2rem] transform translate-x-4 translate-y-4 -z-10"></div>
      <img
        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
        alt="User looking at phone"
        className="rounded-[2rem] w-full object-cover h-[500px] shadow-2xl"
      />
    </div>
  </section>
);

const LogoCloud = () => (
  <section className="bg-gray-50 border-y border-gray-100 py-12">
    <div className="max-w-7xl mx-auto px-6">
      <p className="text-center text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-8">
        Powering the next generation of industry leaders
      </p>
      <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale">
        {['GITHUB', 'SLACK', 'STRIPE', 'NOTION', 'LINEAR', 'VERCEL'].map(logo => (
          <span key={logo} className="text-lg font-bold text-gray-600 tracking-wider">
            {logo}
          </span>
        ))}
      </div>
    </div>
  </section>
);

const FeatureSync = () => (
  <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
    <div>
      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
        <RefreshCcw size={24} />
      </div>
      <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
        Real-time sync
        <br />
        redefined.
      </h2>
      <p className="text-gray-500 text-lg mb-10 leading-relaxed">
        Experience millisecond-perfect synchronization across continents. Our proprietary engine handles complex
        conflict resolution so you can focus on the work.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500 mt-1">
            <Globe2 size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">50ms Global Latency</h4>
            <p className="text-sm text-gray-500 mt-1">
              Distributed edge servers ensure your team feels like they're in the same room.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-500 mt-1">
            <Database size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Infinite Multiplayer</h4>
            <p className="text-sm text-gray-500 mt-1">
              Whether it's 2 people or 200, the performance remains silky smooth.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Abstract UI Illustration */}
    <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 h-full min-h-[400px] relative overflow-hidden flex flex-col shadow-inner">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex gap-[-8px]">
          <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white z-20 flex items-center justify-center text-white text-xs font-bold">
            AS
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white z-10 -ml-2 flex items-center justify-center text-white text-xs font-bold">
            BK
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white z-0 -ml-2 flex items-center justify-center text-gray-500 text-xs font-bold">
            +
          </div>
        </div>
      </div>

      <div className="space-y-4 w-full flex-1 relative">
        <div className="w-3/4 h-8 bg-white rounded-lg shadow-sm border border-gray-100"></div>
        <div className="w-full h-4 bg-gray-200 rounded-full opacity-50"></div>
        <div className="w-5/6 h-4 bg-gray-200 rounded-full opacity-50"></div>

        {/* Fake Cursors */}
        <div className="absolute top-12 left-1/2 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-transparent border-b-emerald-500 transform rotate-[-25deg]"></div>
          <div className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">Alice Chen</div>
        </div>

        <div className="absolute bottom-10 left-1/4 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-transparent border-b-blue-500 transform rotate-[-25deg]"></div>
          <div className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full mt-1">Marcus Reid</div>
        </div>

        {/* Fake Comment Bubble */}
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">
              AC
            </div>
            <span className="text-xs font-bold text-gray-900">Alice Chen</span>
          </div>
          <p className="text-[10px] text-gray-500">"Should we update the DB indexing here too?"</p>
        </div>
      </div>

      <div className="mt-auto pt-8 flex justify-between items-center text-[10px] font-semibold text-gray-400 tracking-wider">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> CONNECTED: SINGAPORE
        </span>
        <span>VERSION 2.4.91</span>
      </div>
    </div>
  </section>
);

const FeatureGrid = () => (
  <section className="bg-gray-50 py-24 border-y border-gray-100">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
      <div>
        <Zap className="text-gray-900 mb-6" size={24} />
        <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Feedback</h3>
        <p className="text-gray-500 leading-relaxed">
          Latency-free communication pipelines designed for the modern remote landscape. Never wait for an update again.
        </p>
      </div>
      <div>
        <Lock className="text-gray-900 mb-6" size={24} />
        <h3 className="text-xl font-bold text-gray-900 mb-3">Fortified Security</h3>
        <p className="text-gray-500 leading-relaxed">
          Enterprise-grade encryption is built into the core. Your intellectual property is protected by the highest
          standards.
        </p>
      </div>
      <div>
        <Code2 className="text-gray-900 mb-6" size={24} />
        <h3 className="text-xl font-bold text-gray-900 mb-3">Extensible API</h3>
        <p className="text-gray-500 leading-relaxed">
          Deeply integrated into your existing CI/CD workflows with our developer-first API and robust documentation.
        </p>
      </div>
    </div>
  </section>
);

const SecuritySection = () => (
  <section className="max-w-7xl mx-auto px-6 py-24 text-center">
    <div className="inline-flex items-center text-xs font-bold tracking-widest text-emerald-600 uppercase mb-4">
      Privacy Infrastructure
    </div>
    <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">Security by default.</h2>
    <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-16">
      We've re-engineered the collaboration architecture to ensure data residency and privacy compliance are built-in
      features, not afterthoughts.
    </p>

    <div className="grid md:grid-cols-2 text-left bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="p-10 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
          <ShieldCheck size={20} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">Zero-Trust Access</h4>
        <p className="text-gray-500 text-sm leading-relaxed">
          Comprehensive identity management with native SSO and SCIM provisioning for your entire organization.
        </p>
      </div>
      <div className="p-10 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
          <Lock size={20} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">End-to-End Encryption</h4>
        <p className="text-gray-500 text-sm leading-relaxed">
          Data is encrypted at rest and in transit using AES-256 and TLS 1.3 standards as our baseline security.
        </p>
      </div>
      <div className="p-10 border-b md:border-b-0 md:border-r border-gray-200">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
          <CheckCircle2 size={20} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">Global Compliance</h4>
        <p className="text-gray-500 text-sm leading-relaxed">
          Fully compliant with GDPR, SOC2 Type II, and HIPAA regulations. Regular external security audits.
        </p>
      </div>
      <div className="p-10">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
          <Globe2 size={20} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">Data Residency</h4>
        <p className="text-gray-500 text-sm leading-relaxed">
          Choose where your data lives. We support regional data centers in the US, EU, and Asia Pacific.
        </p>
      </div>
    </div>
  </section>
);

const Integrations = () => {
  const tools = [
    // { name: 'GitHub', icon: <Github size={28} />, initials: 'GH' },
    // { name: 'Slack', icon: <Slack size={28} />, initials: 'SL' },
    { name: 'Jira', icon: <Database size={28} />, initials: 'JR' },
    // { name: 'Figma', icon: <Figma size={28} />, initials: 'FG' },
    { name: 'AWS', icon: <Cloud size={28} />, initials: 'AW' },
    { name: 'Zendesk', icon: <Database size={28} />, initials: 'ZD' },
  ];

  return (
    <section className="bg-[#111111] text-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-lg">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Built for the modern stack</h2>
            <p className="text-gray-400">
              Skryme connects with the tools you already use, creating a seamless flow from initial ideation to final
              production.
            </p>
          </div>
          <button className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors font-medium whitespace-nowrap self-start md:self-auto">
            Explore Marketplace
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {tools.map(tool => (
            <div
              key={tool.name}
              className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-gray-600 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <span className="font-bold text-lg">{tool.initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                {tool.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => (
  <section className="py-32 text-center px-6">
    <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
      Ready to ship
      <br />
      faster?
    </h2>
    <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
      Join 8,000+ high-performing teams building the future of collaboration on Skryme.
    </p>
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <button className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-medium transition-colors">
        Get Started Free
      </button>
      <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg font-medium transition-colors">
        Contact Sales
      </button>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
        <div className="col-span-2 md:col-span-2">
          <div className="font-bold text-xl tracking-tight text-gray-900 mb-4">Skryme</div>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            Reimagining how the world works together. Built for performance, security, and the human element in digital
            workspace.
          </p>
        </div>
        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Product</h5>
          <ul className="space-y-3 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-900">
                Changelog
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                Enterprise
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                Security
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Support</h5>
          <ul className="space-y-3 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-900">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                Contact Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                Documentation
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Legal</h5>
          <ul className="space-y-3 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-900">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                Cookie Settings
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 mb-4">Social</h5>
          <ul className="space-y-3 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-900">
                Twitter
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-900">
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200 text-xs text-gray-400">
        <p>© 2024 Skryme Inc. All rights reserved.</p>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Systems Operational
        </div>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <Hero />
      <LogoCloud />
      <FeatureSync />
      <FeatureGrid />
      <SecuritySection />
      <Integrations />
      <CTA />
      <Footer />
    </div>
  );
}
