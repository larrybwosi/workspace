import React from 'react';
import {
  MessageSquare,
  Network,
  Zap,
  Search,
  ClipboardList,
  Layout,
  CheckCircle2,
  Users,
  Bell,
  GitCommit,
  RefreshCw,
  Terminal,
  ArrowRight,
  ShieldCheck,
  Key,
  Globe,
  Mail,
  Share2,
} from 'lucide-react';

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-violet-50/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(45,42,81,0.05)]">
    <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
      <div className="text-xl font-bold tracking-tighter text-indigo-700 dark:text-indigo-300">Skryme Chat</div>
      <div className="hidden md:flex gap-8 items-center font-headline font-medium text-sm tracking-tight">
        <a
          className="text-indigo-700 dark:text-indigo-300 font-semibold border-b-2 border-indigo-600 transition-colors duration-300"
          href="#"
        >
          Product
        </a>
        <a
          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
          href="#"
        >
          Workspaces
        </a>
        <a
          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
          href="#"
        >
          Integrations
        </a>
        <a
          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-300"
          href="#"
        >
          Pricing
        </a>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-6 py-2.5 bg-primary text-on-primary rounded-full font-headline font-bold text-sm scale-95 active:scale-90 transition-transform cursor-pointer">
          Start Collaborating
        </button>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative px-6 pt-24 pb-40 overflow-hidden">
    <div className="max-w-7xl mx-auto text-center relative z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 bg-surface-container-low border border-outline-variant/30 rounded-full">
        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
        <span className="text-[0.65rem] font-bold tracking-widest uppercase text-on-surface-variant">
          Next-Gen Collaboration
        </span>
      </div>
      <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter text-on-background mb-10 leading-[1.05] max-w-5xl mx-auto font-headline">
        The Command Center for{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-primary-dim">
          Modern Engineering Teams.
        </span>
      </h1>
      <p className="max-w-4xl mx-auto text-xl md:text-2xl text-on-surface-variant mb-14 leading-relaxed font-light font-body">
        One unified workspace for real-time messaging, organizational channels, and seamless project execution. Bridge
        the gap between individual focus and global team alignment.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <button className="px-10 py-5 bg-on-background text-white rounded-xl font-headline font-bold text-lg shadow-2xl transition-all hover:translate-y-[-2px] hover:shadow-primary/20 cursor-pointer">
          Create Your Workspace
        </button>
        <button className="px-10 py-5 bg-surface-container-high text-on-surface rounded-xl font-headline font-bold text-lg border border-outline-variant/20 transition-all hover:bg-surface-variant/30 cursor-pointer">
          See How It Works
        </button>
      </div>
    </div>
    {/* Product UI Mockup (Abstract Visual) */}
    <div className="mt-24 max-w-7xl mx-auto px-6 relative">
      <div className="relative w-full aspect-[21/9] rounded-[3rem] overflow-hidden bg-slate-950 border border-white/10 shadow-3xl">
        <div className="absolute inset-0 flex">
          {/* Left Sidebar Sidebar Mockup */}
          <div className="w-64 bg-slate-900/50 border-r border-white/5 p-6 space-y-6 hidden md:block">
            <div className="space-y-3">
              <div className="h-3 w-16 bg-white/20 rounded"></div>
              <div className="h-4 w-32 bg-primary/40 rounded"></div>
              <div className="h-4 w-28 bg-white/10 rounded"></div>
            </div>
            <div className="space-y-3 pt-6">
              <div className="h-2 w-12 bg-white/10 rounded"></div>
              <div className="h-4 w-full bg-white/5 rounded"></div>
              <div className="h-4 w-full bg-white/5 rounded"></div>
              <div className="h-4 w-full bg-white/5 rounded"></div>
            </div>
          </div>
          {/* Main Chat/Issue Mockup Area */}
          <div className="flex-1 p-8 grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/20 rounded"></div>
                  <div className="h-20 w-full bg-white/5 rounded-xl border border-white/5"></div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-white/20 rounded"></div>
                  <div className="h-12 w-3/4 bg-white/5 rounded-xl"></div>
                </div>
              </div>
            </div>
            <div className="col-span-1 bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
              <div className="h-4 w-20 bg-primary-fixed/40 rounded"></div>
              <div className="h-32 bg-white/5 rounded-lg"></div>
              <div className="h-4 w-full bg-white/10 rounded"></div>
              <div className="h-4 w-2/3 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        <div className="absolute bottom-12 left-12 text-left">
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.4em] mb-2">Workspace Preview</p>
          <p className="text-white font-headline text-2xl font-bold">Unified Collaboration Interface</p>
        </div>
      </div>
    </div>
  </section>
);

const MessagingFocus = () => (
  <section className="py-32 bg-surface">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-background mb-8 leading-tight font-headline">
            Messaging for <span className="text-primary">Individuals & Teams.</span>
          </h2>
          <p className="text-on-surface-variant text-xl leading-relaxed mb-10 font-body">
            Say goodbye to fragmented conversations. Skryme organizes your real-time collaboration into structured
            workflows that keep everyone in sync.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MessageSquare size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 font-headline">Channels & DMs</h4>
                <p className="text-on-surface-variant font-body">
                  Organize by project, department, or topic. Private 1:1 messaging for focused individual syncs.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Network size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 font-headline">Organized Threads</h4>
                <p className="text-on-surface-variant font-body">
                  Keep discussions contextual. Resolve technical questions without cluttering the main channel.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1 font-headline">Real-time Presence</h4>
                <p className="text-on-surface-variant font-body">
                  Know who's available, who's in "deep work" mode, and who's shipping code.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="bg-white rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center">
              <span className="font-bold text-sm"># engineering-general</span>
              <Search size={18} className="text-on-surface-variant" />
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold font-headline">
                    Jane Doe <span className="font-normal text-xs text-on-surface-variant ml-2">10:42 AM</span>
                  </p>
                  <p className="text-on-surface-variant font-body">
                    Has anyone checked the performance regression in the v2.4 protocol?
                  </p>
                  <div className="mt-4 p-4 bg-surface-container-high rounded-xl border border-outline-variant/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList size={16} className="text-primary" />
                      <span className="text-xs font-bold text-primary">ISSUE #482</span>
                    </div>
                    <p className="text-sm font-medium font-headline">Memory leak in websocket handler</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const IssuesProjects = () => (
  <section className="py-32 bg-surface-container-low">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col lg:flex-row-reverse gap-20 items-center">
        <div className="lg:w-1/2">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-on-background mb-8 leading-tight font-headline">
            Issue Tracking & <span className="text-primary">Project Workspaces.</span>
          </h2>
          <p className="text-on-surface-variant text-xl leading-relaxed mb-10 font-body">
            Stop switching tabs. Manage your entire product lifecycle within the same environment where you communicate.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <li className="p-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <Layout size={24} className="text-primary mb-4" />
              <h4 className="font-bold mb-2 font-headline">Kanban Boards</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                Visualize progress across your team's custom Workspaces.
              </p>
            </li>
            <li className="p-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <CheckCircle2 size={24} className="text-primary mb-4" />
              <h4 className="font-bold mb-2 font-headline">Native Issues</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                Turn any message into a tracked issue with one click.
              </p>
            </li>
            <li className="p-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <Users size={24} className="text-primary mb-4" />
              <h4 className="font-bold mb-2 font-headline">Sprints & Cycles</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                Define milestones and track velocity within your Channels.
              </p>
            </li>
            <li className="p-6 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <Bell size={24} className="text-primary mb-4" />
              <h4 className="font-bold mb-2 font-headline">Smart Reminders</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                Never lose track of a critical bug or stakeholder request.
              </p>
            </li>
          </ul>
        </div>
        <div className="lg:w-1/2 w-full">
          <div className="bg-white rounded-[2.5rem] shadow-3xl border border-outline-variant/20 p-8">
            {/* Simple Board Mockup */}
            <div className="flex gap-4 mb-8">
              <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                Active Sprint
              </div>
              <div className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">
                Backlog
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-2 w-12 bg-on-background/10 rounded"></div>
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-3">
                  <div className="h-4 w-3/4 bg-on-background/20 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-4 w-4 rounded bg-red-400/30"></div>
                    <div className="h-4 w-12 bg-on-background/5 rounded"></div>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-3">
                  <div className="h-4 w-1/2 bg-on-background/20 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-4 w-4 rounded bg-blue-400/30"></div>
                    <div className="h-4 w-12 bg-on-background/5 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-2 w-12 bg-on-background/10 rounded"></div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
                  <div className="h-4 w-5/6 bg-primary/30 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-4 w-4 rounded bg-green-400/30"></div>
                    <div className="h-4 w-12 bg-primary/10 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Integrations = () => (
  <section className="py-32">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col lg:flex-row gap-20 items-center">
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-bold mb-8 tracking-tight font-headline">
            Turn Conversations <br />
            <span className="text-primary">into Commits and PRs.</span>
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-10 font-body">
            Our deep-level GitHub integration means you can manage your code without leaving the chat. Link issues,
            review PRs, and track deployments directly in your project channels.
          </p>
          <ul className="space-y-6 mb-10">
            <li className="flex items-center gap-3 text-on-surface">
              <GitCommit size={20} className="text-primary" />
              <span className="font-medium font-body">Live PR notifications & quick-reviews</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <RefreshCw size={20} className="text-primary" />
              <span className="font-medium font-body">Auto-sync issues with GitHub milestones</span>
            </li>
            <li className="flex items-center gap-3 text-on-surface">
              <Terminal size={20} className="text-primary" />
              <span className="font-medium font-body">Deploy triggers from Workspace commands</span>
            </li>
          </ul>
          <a className="text-primary font-bold inline-flex items-center gap-2 group font-headline" href="#">
            Explore our GitHub App
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        <div className="lg:w-1/2 w-full">
          <div className="bg-indigo-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            <div className="flex items-center gap-2 px-6 py-4 bg-indigo-900/30 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-400/50"></div>
              </div>
              <span className="ml-4 text-[10px] font-mono text-indigo-300 uppercase tracking-widest">
                github-bot output
              </span>
            </div>
            <div className="p-10 font-mono text-sm">
              <pre className="text-indigo-100">
                <code>
                  <span className="text-slate-400"># Pull Request Opened</span>
                  <br />
                  <span className="text-purple-400">skryme-bot</span> [github] -&gt;{' '}
                  <span className="text-green-400">PR #841</span>
                  <br />
                  Title: <span className="text-white">"Optimize DB indexing for global search"</span>
                  <br />
                  Author: <span className="text-indigo-300">@alex_dev</span>
                  <br />
                  Status: <span className="text-yellow-400">Pending Review</span>
                  <br />
                  <br />
                  <span className="text-slate-400"># Action taken via Skryme command</span>
                  <br />
                  <span className="text-purple-400">/github</span> approve #841 --comment{' '}
                  <span className="text-green-400">"LGTM! Shipping it."</span>
                  <br />
                  <span className="text-slate-400">&gt; PR approved. Merging to main... Done.</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Foundation = () => (
  <section className="py-32 bg-on-background text-white overflow-hidden relative">
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight font-headline">
          The Foundation for <span className="text-primary-fixed">Secure Collaboration.</span>
        </h2>
        <p className="text-slate-400 text-xl leading-relaxed font-body">
          Collaboration is only as strong as its security. Skryme Chat provides the enterprise-grade protocols required
          by the world's most innovative engineering firms.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
        <div className="space-y-6">
          <ShieldCheck size={48} className="text-primary-fixed" />
          <h4 className="text-2xl font-bold font-headline">Secure Workspaces</h4>
          <p className="text-slate-400 leading-relaxed font-body">
            SOC2 Type II and GDPR compliance built into every channel. Total data residency control for sovereign cloud
            needs.
          </p>
        </div>
        <div className="space-y-6">
          <Key size={48} className="text-primary-fixed" />
          <h4 className="text-2xl font-bold font-headline">Unified SSO</h4>
          <p className="text-slate-400 leading-relaxed font-body">
            Native Okta, Azure AD, and Google Workspace integration. Automated provisioning for your entire
            organization.
          </p>
        </div>
        <div className="space-y-6">
          <Network size={48} className="text-primary-fixed" />
          <h4 className="text-2xl font-bold font-headline">Reliable Real-time</h4>
          <p className="text-slate-400 leading-relaxed font-body">
            99.99% uptime SLA ensures your team is never disconnected from critical communication or project work.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const Stats = () => (
  <section className="py-12 border-b border-outline-variant/10 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
        <div className="text-center">
          <p className="text-3xl font-extrabold text-on-background font-headline">99.99%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-body">Uptime SLA</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-extrabold text-on-background font-headline">SOC2</p>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-body">
            Type II Certified
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-extrabold text-on-background font-headline">E2EE</p>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-body">
            End-to-End Encryption
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-extrabold text-on-background font-headline">ISO</p>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-body">
            27001 Security
          </p>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-40 bg-white">
    <div className="max-w-7xl mx-auto px-6">
      <div className="bg-primary rounded-[4rem] p-16 lg:p-32 text-center relative overflow-hidden shadow-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary to-primary-dim"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-7xl font-extrabold text-white mb-10 tracking-tighter font-headline">
            Ready to Scale Your Team?
          </h2>
          <p className="text-white/80 text-xl md:text-2xl max-w-3xl mx-auto mb-16 font-light font-body">
            Join the world's most innovative engineering teams using Skryme Chat to communicate, collaborate, and
            execute with precision.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button className="px-12 py-6 bg-white text-primary rounded-2xl font-headline font-bold text-xl shadow-xl transition-transform hover:scale-105 cursor-pointer">
              Start Your Workspace Free
            </button>
            <button className="px-12 py-6 bg-transparent border-2 border-white/30 text-white rounded-2xl font-headline font-bold text-xl hover:bg-white/10 transition-colors cursor-pointer">
              Talk to Enterprise Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="w-full rounded-t-[2.5rem] mt-24 bg-violet-50 dark:bg-slate-950">
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 px-8 py-16 max-w-7xl mx-auto font-body text-sm leading-relaxed">
      <div className="col-span-2">
        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-6">Skryme Chat</div>
        <p className="text-slate-500 dark:text-slate-500 max-w-xs mb-8">
          © 2024 Skryme Chat. The ultimate collaboration layer for high-velocity engineering organizations.
        </p>
        <div className="flex gap-4">
          <Globe size={20} className="text-indigo-600 cursor-pointer hover:text-indigo-500" />
          <Mail size={20} className="text-indigo-600 cursor-pointer hover:text-indigo-500" />
          <Share2 size={20} className="text-indigo-600 cursor-pointer hover:text-indigo-500" />
        </div>
      </div>
      <div>
        <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-6 uppercase tracking-widest text-[0.65rem] font-headline">
          Workspace
        </h4>
        <ul className="space-y-4">
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Messaging
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Channels
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Issues
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Integrations
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-6 uppercase tracking-widest text-[0.65rem] font-headline">
          Company
        </h4>
        <ul className="space-y-4">
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              About
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Blog
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Security
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-6 uppercase tracking-widest text-[0.65rem] font-headline">
          Support
        </h4>
        <ul className="space-y-4">
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Help Center
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Privacy
            </a>
          </li>
          <li>
            <a
              className="text-slate-500 dark:text-slate-500 hover:text-indigo-500 underline decoration-2 underline-offset-4 transition-opacity"
              href="#"
            >
              Terms
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body">
      <main>
        <Hero />
        <MessagingFocus />
        <IssuesProjects />
        <Integrations />
        <Foundation />
        <Stats />
        <FinalCTA />
      </main>
    </div>
  );
}
