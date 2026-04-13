import { Globe, Mail, Share2 } from 'lucide-react';

export const Footer = () => (
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
        <p className="text-[12px] text-slate-400">© 2026 Skryme, Inc. All rights reserved.</p>
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
