import { Helmet } from 'react-helmet-async';
import { Button } from '@repo/ui/components/button';
import { Check } from 'lucide-react';

export function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for small teams getting started.",
      features: ["Unlimited Messages", "5 Team Members", "Basic Integrations", "10GB Storage"]
    },
    {
      name: "Pro",
      price: "$12",
      description: "Advanced features for growing companies.",
      features: ["Unlimited Members", "Custom Emojis", "Advanced Bots", "100GB Storage", "Priority Support"],
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Scale with confidence and control.",
      features: ["SAML SSO", "Audit Logs", "Unlimited Storage", "Dedicated Success Manager", "Custom SLA"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Pricing | Workspace</title>
        <meta name="description" content="Flexible pricing plans for teams of all sizes. Start for free today." />
      </Helmet>
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h1>
            <p className="text-slate-500">Choose the plan that's right for your team.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, i) => (
              <div key={i} className={`p-8 rounded-2xl border ${tier.highlight ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'} flex flex-col`}>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-slate-500">/mo</span>}
                </div>
                <p className="text-slate-500 mb-8">{tier.description}</p>
                <ul className="space-y-4 mb-8 flex-grow">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-600">
                      <Check className="h-5 w-5 text-blue-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={tier.highlight ? 'default' : 'outline'} className="w-full">
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
