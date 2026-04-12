'use client';

import {
  MessageSquare,
  Network,
  Zap,
  Search,
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
  Building2,
  Lock,
  BarChart2,
  Webhook,
  Bot,
  Code2,
  Plug,
} from 'lucide-react';

const Navbar = () => (
  <nav className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
    <div className="flex justify-between items-center w-full px-10 py-0 h-14 max-w-screen-xl mx-auto">
      <div className="flex items-center gap-10">
        <span className="text-[15px] font-medium tracking-tight text-slate-900 dark:text-white">Skryme</span>
        <div className="hidden md:flex gap-7">
          {['Product', 'Workspaces', 'Integrations', 'Pricing', 'Enterprise'].map(item => (
            <a
              key={item}
              href="#"
              className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="#"
          className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Sign in
        </a>
        <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-medium rounded cursor-pointer hover:opacity-85 transition-opacity">
          Get started
        </button>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="px-10 pt-24 pb-20 border-b border-slate-200 dark:border-slate-800">
    <div className="max-w-screen-xl mx-auto">
      <div className="max-w-2xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[12px] text-slate-500 dark:text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
          Now with AI-powered threads
        </div>
        <h1 className="text-5xl md:text-[52px] font-medium tracking-tight text-slate-900 dark:text-white mb-5 leading-[1.1]">
          Communication for teams and individuals.
        </h1>
        <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-xl">
          Skryme brings together real-time messaging, organization workspaces, and developer integrations — for teams
          building software and friends staying connected.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[14px] font-medium rounded cursor-pointer hover:opacity-85 transition-opacity">
            Start for free
          </button>
          <button className="px-6 py-3 bg-transparent text-slate-900 dark:text-white text-[14px] font-medium rounded border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            View demo
          </button>
        </div>
      </div>

      {/* App mockup */}
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span className="ml-3 text-[11px] text-slate-400 dark:text-slate-500">Acme Corp — #engineering</span>
        </div>
        <div className="flex h-80">
          {/* Sidebar */}
          <div className="w-52 border-r border-slate-200 dark:border-slate-800 p-4 hidden md:block bg-white dark:bg-slate-950 flex-shrink-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              Workspace
            </p>
            <p className="text-[13px] font-medium text-slate-900 dark:text-white mb-3">Acme Corp</p>
            <div className="text-[12px] text-slate-500 dark:text-slate-400 mb-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
              # engineering
            </div>
            {['# design', '# general', '# releases'].map(c => (
              <div key={c} className="text-[12px] text-slate-400 dark:text-slate-500 mb-1 px-2 py-1">
                {c}
              </div>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-800 my-3" />
            <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              Direct messages
            </p>
            {['Alex Kim', 'Sam Chen'].map(n => (
              <div key={n} className="text-[12px] text-slate-400 dark:text-slate-500 mb-1 px-2 py-1">
                {n}
              </div>
            ))}
          </div>
          {/* Messages */}
          <div className="flex-1 p-6">
            <div className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded flex-shrink-0 bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-medium text-blue-700 dark:text-blue-300">
                AK
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white mb-1">
                  Alex Kim <span className="font-normal text-[11px] text-slate-400">10:41 AM</span>
                </p>
                <div className="text-[13px] text-slate-600 dark:text-slate-300 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded max-w-sm">
                  Hey team, the v2.4 deploy is ready. Can someone review the PR before we push?
                </div>
              </div>
            </div>
            <div className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded flex-shrink-0 bg-green-100 dark:bg-green-900 flex items-center justify-center text-[10px] font-medium text-green-700 dark:text-green-300">
                SC
              </div>
              <div>
                <p className="text-[13px] font-medium text-slate-900 dark:text-white mb-1">
                  Sam Chen <span className="font-normal text-[11px] text-slate-400">10:43 AM</span>
                </p>
                <div className="text-[13px] text-slate-600 dark:text-slate-300 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded max-w-sm">
                  On it. Also linking the issue — <span className="text-blue-500">#issue-482</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[12px]">
              <span className="text-slate-400">skryme-bot</span>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-[11px] font-medium">
                PR #841 approved
              </span>
              <span className="text-slate-400">Merged to main</span>
              <span className="ml-auto px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[11px] font-medium">
                GitHub
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Stats = () => (
  <section className="py-16 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { val: '99.99%', label: 'Uptime SLA' },
          { val: 'SOC 2 II', label: 'Certified' },
          { val: 'E2EE', label: 'End-to-end encryption' },
          { val: 'ISO 27001', label: 'Security standard' },
        ].map(s => (
          <div key={s.val}>
            <p className="text-[28px] font-medium tracking-tight text-slate-900 dark:text-white">{s.val}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const MessagingSection = () => (
  <section className="py-20 border-b border-slate-200 dark:border-slate-800">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            Messaging
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            Channels, DMs, and threads — all in one place.
          </h2>
          <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            Whether you're coordinating a sprint or catching up with a friend, Skryme keeps every conversation organized
            and searchable.
          </p>
          <div className="space-y-6">
            {[
              {
                icon: <MessageSquare size={16} />,
                title: 'Channels and DMs',
                body: 'Organize by team, project, or topic. Private 1:1 messaging for direct sync.',
              },
              {
                icon: <Network size={16} />,
                title: 'Threaded replies',
                body: 'Keep context intact. Resolve discussions inline without cluttering the channel.',
              },
              {
                icon: <Zap size={16} />,
                title: 'Presence and status',
                body: "See who's active, in focus mode, or away — across teams and personal contacts.",
              },
              {
                icon: <Search size={16} />,
                title: 'Powerful search',
                body: 'Full-text search across all channels, DMs, and attachments — instantly.',
              },
            ].map(f => (
              <div key={f.title} className="flex gap-4">
                <div className="w-9 h-9 flex-shrink-0 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center text-slate-500 dark:text-slate-400">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-[15px] font-medium text-slate-900 dark:text-white mb-1">{f.title}</h4>
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Thread mockup */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-900 dark:text-white"># design-feedback</span>
            <span className="text-[11px] text-slate-400">4 members</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-[9px] font-medium text-purple-700 dark:text-purple-300 flex-shrink-0">
                JD
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-medium text-slate-900 dark:text-white mb-1">
                  Jane Doe <span className="font-normal text-slate-400">2:14 PM</span>
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Updated the component library — adding a thread here for feedback
                </p>
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                  <p className="text-[11px] font-medium text-slate-400 mb-2">Thread · 3 replies</p>
                  <div className="flex gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-[8px] font-medium text-teal-700 dark:text-teal-300">
                      MR
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                      Looks great — one comment on the spacing
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-[8px] font-medium text-amber-700 dark:text-amber-300">
                      TK
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">LGTM — ready to merge</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-[9px] font-medium text-teal-700 dark:text-teal-300 flex-shrink-0">
                MR
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-900 dark:text-white mb-1">
                  Maya Rodriguez <span className="font-normal text-slate-400">2:31 PM</span>
                </p>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  Also works for mobile viewports — tested on iPhone 15
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const WorkspacesSection = () => (
  <section className="py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
          Workspaces
        </p>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-4">
          Built for organizations of every size.
        </h2>
        <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Create a workspace for your company, team, or community. Invite members, define roles, and structure your
          collaboration.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
        {[
          {
            icon: <Building2 size={16} />,
            title: 'Organization workspaces',
            body: 'A dedicated space for your entire company — custom branding, domain-based sign-in, and admin controls.',
          },
          {
            icon: <Users size={16} />,
            title: 'Teams within workspaces',
            body: 'Segment your workspace into teams — engineering, design, sales — each with their own channels and permissions.',
          },
          {
            icon: <Lock size={16} />,
            title: 'Roles and permissions',
            body: 'Granular access controls — owner, admin, member, guest. Restrict channels by role or team membership.',
          },
          {
            icon: <MessageSquare size={16} />,
            title: 'Personal spaces',
            body: 'Not just for work — create personal workspaces for friend groups, communities, or side projects.',
          },
          {
            icon: <Bell size={16} />,
            title: 'Notifications and focus',
            body: 'Custom notification schedules per workspace. Focus mode silences non-urgent channels during deep work.',
          },
          {
            icon: <BarChart2 size={16} />,
            title: 'Analytics and insights',
            body: 'Workspace activity dashboards for admins — member engagement, channel health, and message volume.',
          },
        ].map(f => (
          <div key={f.title} className="p-7 bg-white dark:bg-slate-950">
            <div className="w-9 h-9 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
              {f.icon}
            </div>
            <h3 className="text-[16px] font-medium text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const GitHubSection = () => (
  <section className="py-20 border-b border-slate-200 dark:border-slate-800">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            GitHub Integration
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            From conversation to commit — without switching tabs.
          </h2>
          <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            Our native GitHub integration brings pull requests, issues, and deployments directly into your team
            channels. Review, approve, and ship without leaving Skryme.
          </p>
          <div className="space-y-6">
            {[
              {
                icon: <GitCommit size={16} />,
                title: 'Live PR notifications',
                body: 'Get notified the moment a PR is opened, reviewed, or merged — right in your project channel.',
              },
              {
                icon: <CheckCircle2 size={16} />,
                title: 'Quick approve and merge',
                body: 'Approve pull requests or request changes directly from Skryme using slash commands.',
              },
              {
                icon: <RefreshCw size={16} />,
                title: 'Deploy triggers',
                body: 'Trigger staging and production deployments from workspace commands without leaving chat.',
              },
              {
                icon: <Terminal size={16} />,
                title: 'Issue sync',
                body: 'Automatically sync GitHub issues to your Skryme workspace — link discussions to code.',
              },
            ].map(f => (
              <div key={f.title} className="flex gap-4">
                <div className="w-9 h-9 flex-shrink-0 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center text-slate-500 dark:text-slate-400">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-[15px] font-medium text-slate-900 dark:text-white mb-1">{f.title}</h4>
                  <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 mt-8 text-[14px] font-medium text-slate-900 dark:text-white group"
          >
            Explore the GitHub app
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
        {/* Terminal mockup */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#30363d]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c941]" />
            <span className="ml-3 text-[11px] text-[#8b949e] font-mono">#releases — skryme-bot</span>
          </div>
          <div className="p-6 font-mono text-[12px] space-y-4">
            <div>
              <p className="text-[#8b949e] mb-1">— Pull Request opened</p>
              <p className="text-[#c9d1d9]">
                <span className="text-[#7ee787]">skryme-bot</span> [github] →{' '}
                <span className="text-[#58a6ff]">PR #841</span>
              </p>
              <p className="text-[#c9d1d9]">
                Title: <span className="text-[#e3b341]">"Optimize DB indexing for search"</span>
              </p>
              <p className="text-[#c9d1d9]">
                Author: <span className="text-[#a5d6ff]">@alex_dev</span> · Status:{' '}
                <span className="text-[#e3b341]">Pending review</span>
              </p>
            </div>
            <div className="border-t border-[#30363d] pt-4">
              <p className="text-[#8b949e] mb-1">— Command from @sam_chen</p>
              <p className="text-[#c9d1d9]">
                <span className="text-[#7ee787]">/github</span> approve #841{' '}
                <span className="text-[#e3b341]">--comment "LGTM, shipping"</span>
              </p>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded p-3">
              <p className="text-[#8b949e] mb-1">— Result</p>
              <p className="text-[#7ee787]">✓ PR approved · Merging to main · Deploy triggered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const APISection = () => (
  <section className="py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
          API and Integrations
        </p>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-4">
          Build on Skryme. Connect everything.
        </h2>
        <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Use our REST and WebSocket API to build bots, automate workflows, and connect the tools your team already
          uses.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
        {[
          {
            icon: <Code2 size={16} />,
            label: 'REST API',
            title: 'Full platform API',
            body: 'Send messages, manage channels, query user data, and configure workspaces programmatically.',
          },
          {
            icon: <Zap size={16} />,
            label: 'WebSocket',
            title: 'Real-time events',
            body: 'Subscribe to channel events, presence updates, and message streams with low-latency connections.',
          },
          {
            icon: <Webhook size={16} />,
            label: 'Webhooks',
            title: 'Event-driven automation',
            body: 'Trigger external workflows when messages are sent, channels are created, or members join.',
          },
          {
            icon: <Bot size={16} />,
            label: 'Bots',
            title: 'Custom bot framework',
            body: 'Build interactive bots that respond to slash commands, post updates, and integrate with internal tools.',
          },
          {
            icon: <Plug size={16} />,
            label: 'Integrations',
            title: '50+ native connectors',
            body: 'GitHub, Jira, Linear, Notion, PagerDuty, Datadog, and more — all available out of the box.',
          },
          {
            icon: <Layout size={16} />,
            label: 'SDKs',
            title: 'Official client libraries',
            body: 'TypeScript, Python, Go, and Ruby SDKs with full type coverage and comprehensive documentation.',
          },
        ].map(f => (
          <div key={f.title} className="p-7 bg-white dark:bg-slate-950">
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              {f.label}
            </p>
            <div className="w-9 h-9 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
              {f.icon}
            </div>
            <h3 className="text-[16px] font-medium text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const SecuritySection = () => (
  <section className="py-20 border-b border-slate-200 dark:border-slate-800">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="text-center max-w-xl mx-auto mb-14">
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
          Security
        </p>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-4">
          Enterprise-grade security, by default.
        </h2>
        <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Skryme is built for teams where security is non-negotiable. Every workspace is protected by industry-leading
          standards.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <ShieldCheck size={16} />,
            title: 'Compliance ready',
            body: 'SOC 2 Type II and GDPR compliant. Data residency controls for sovereign cloud requirements.',
          },
          {
            icon: <Key size={16} />,
            title: 'Unified SSO',
            body: 'Okta, Azure AD, and Google Workspace supported. SCIM provisioning for automated onboarding and offboarding.',
          },
          {
            icon: <Lock size={16} />,
            title: 'End-to-end encryption',
            body: 'Messages encrypted in transit and at rest. Optional E2EE for sensitive channels — only members can read them.',
          },
        ].map(f => (
          <div
            key={f.title}
            className="p-7 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded"
          >
            <div className="w-9 h-9 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
              {f.icon}
            </div>
            <h3 className="text-[16px] font-medium text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="py-20 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-16 flex items-center justify-between gap-10 flex-wrap">
        <div className="max-w-lg">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-slate-900 dark:text-white mb-4">
            Ready to bring your team together?
          </h2>
          <p className="text-[17px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Start free — no credit card required. Create your workspace in under two minutes.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[14px] font-medium rounded cursor-pointer hover:opacity-85 transition-opacity">
            Create a workspace
          </button>
          <button className="px-6 py-3 bg-transparent text-slate-900 dark:text-white text-[14px] font-medium rounded border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Talk to sales
          </button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-12 bg-white dark:bg-slate-950">
    <div className="max-w-screen-xl mx-auto px-10">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">
        <div className="col-span-2">
          <p className="text-[14px] font-medium text-slate-900 dark:text-white mb-3">Skryme</p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px] mb-6">
            Team communication and collaboration for modern engineering organizations and individuals.
          </p>
          <div className="flex gap-4">
            <Globe size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300" />
            <Mail size={16} className="text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300" />
            <Share2
              size={16}
              className="text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
            />
          </div>
        </div>
        {[
          { heading: 'Product', links: ['Messaging', 'Workspaces', 'Integrations', 'API'] },
          { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
          { heading: 'Developers', links: ['API docs', 'SDKs', 'Changelog', 'Status'] },
          { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
        ].map(col => (
          <div key={col.heading}>
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              {col.heading}
            </p>
            <ul className="space-y-3">
              {col.links.map(link => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-[12px] text-slate-400">© 2025 Skryme, Inc. All rights reserved.</p>
        <div className="flex gap-6">
          {['System status', 'Security', 'Contact'].map(l => (
            <a
              key={l}
              href="#"
              className="text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    // <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
    //   <Navbar />
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body">
      <main>
        <Hero />
        <Stats />
        <MessagingSection />
        <WorkspacesSection />
        <GitHubSection />
        <APISection />
        <SecuritySection />
        <CTA />
      </main>
    </div>
  );
}
