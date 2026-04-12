import { Helmet } from 'react-helmet-async';

export function Teams() {
  return (
    <>
      <Helmet>
        <title>Teams | Skryme Developer Portal</title>
      </Helmet>

      <div className="px-12 pb-12">
        <section className="mb-12">
          <span className="text-xs font-bold text-secondary tracking-widest uppercase mb-2 block">MANAGEMENT</span>
          <h2 className="text-4xl font-extrabold text-on-surface -tracking-tight">
            My <span className="text-secondary">Teams</span>
          </h2>
          <p className="text-on-surface-variant mt-2 max-w-lg">
            Manage your developer teams and collaborate on applications.
          </p>
        </section>

        <div className="bg-surface-container-lowest rounded-xl p-12 border border-outline-variant/10 text-center">
          <div className="w-20 h-20 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">groups</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">No teams found</h3>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            You haven't joined or created any developer teams yet. Teams allow you to share access to applications with other developers.
          </p>
          <button className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            Create Team
          </button>
        </div>
      </div>
    </>
  );
}
