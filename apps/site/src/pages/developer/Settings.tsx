import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/use-auth';

export function Settings() {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Settings | Skryme Developer Portal</title>
      </Helmet>

      <div className="px-12 pb-12">
        <section className="mb-12">
          <span className="text-xs font-bold text-secondary tracking-widest uppercase mb-2 block">PREFERENCES</span>
          <h2 className="text-4xl font-extrabold text-on-surface -tracking-tight">
            Account <span className="text-secondary">Settings</span>
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-lg">
            Manage your developer account preferences and security settings.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Profile Information
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface-variant">Full Name</label>
                    <div className="p-3 bg-surface-container-low rounded-lg text-on-surface">
                      {user?.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface-variant">Email Address</label>
                    <div className="p-3 bg-surface-container-low rounded-lg text-on-surface">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                Security
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-on-surface-variant">
                  Your account is managed through the main Workspace platform. To change your password or security settings, please visit the Workspace account portal.
                </p>
                <button className="text-primary font-bold flex items-center gap-2 hover:underline">
                  Manage Account on Workspace
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-primary/5 rounded-xl p-8 border border-primary/10">
              <h3 className="text-lg font-bold mb-4 text-primary">Developer Plan</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                You are currently on the <span className="font-bold text-on-surface">Free Tier</span>. Upgrade to unlock more features and higher API limits.
              </p>
              <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-shadow">
                Upgrade Now
              </button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
