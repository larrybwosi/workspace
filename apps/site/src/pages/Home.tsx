import { Helmet } from 'react-helmet-async';
import { Button } from '@repo/ui/components/button';
import { CheckCircle2, MessageSquare, Zap, Shield, Users, Code } from 'lucide-react';

export function Home() {
  return (
    <>
      <Helmet>
        <title>Workspace | Modern Team Collaboration Platform</title>
        <meta name="description" content="Workspace is the ultimate platform for team collaboration, featuring real-time chat, bot integrations, and developer-friendly tools." />
      </Helmet>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-linear-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Work together, <span className="text-blue-600">better.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            The all-in-one collaboration platform that brings your team, tools, and workflows together in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="text-lg px-8">Start for Free</Button>
            <Button size="lg" variant="outline" className="text-lg px-8">Book a Demo</Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything your team needs</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Powerful features to help you build and scale with ease.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <MessageSquare className="h-8 w-8 text-blue-500" />, title: "Real-time Chat", description: "Lightning fast messaging with support for rich media, custom emojis, and threading." },
              { icon: <Zap className="h-8 w-8 text-yellow-500" />, title: "Powerful Integrations", description: "Connect with your favorite tools like GitHub, Plane, and more in seconds." },
              { icon: <Shield className="h-8 w-8 text-green-500" />, title: "Enterprise Security", description: "Bank-grade encryption and granular permissions to keep your data safe." },
              { icon: <Users className="h-8 w-8 text-purple-500" />, title: "Team Management", description: "Organize your team into departments, groups, and projects effortlessly." },
              { icon: <Code className="h-8 w-8 text-pink-500" />, title: "Developer First", description: "Robust APIs and SDKs to build custom bots and automations." },
              { icon: <CheckCircle2 className="h-8 w-8 text-orange-500" />, title: "Smart Workflows", description: "Automate repetitive tasks with built-in approval flows and bots." },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-start p-6 border rounded-2xl hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">Trusted by teams everywhere</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { text: "Workspace has completely transformed how our engineering team communicates. The bot integrations are a game changer.", author: "Sarah Chen", role: "CTO at TechFlow" },
              { text: "Finally, a platform that understands what modern teams need. It's fast, intuitive, and actually fun to use.", author: "Marcus Miller", role: "Product Manager at Pulse" }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border">
                <p className="text-lg text-slate-600 italic mb-6">"{t.text}"</p>
                <div>
                  <div className="font-bold text-slate-900">{t.author}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
