'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Last updated: January 15, 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert space-y-6 text-foreground/80 leading-relaxed">
            <p>
              At Scrymechat, we take your privacy seriously. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our enterprise communication platform,
              including our mobile application, web application, and related services.
            </p>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us when creating or modifying your account,
                inviting team members, communicating with others within the platform, or contacting customer support. This may include:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account details (e.g., name, email address, password, profile picture)</li>
                <li>Communications and messaging data within channels, direct messages, and threads</li>
                <li>Billing and payment details (processed securely via our payment gateways)</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>We use the information we collect to operate, maintain, and improve our services, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Providing core platform functionality, real-time messaging, and notifications</li>
                <li>Processing transactions and sending related financial/billing correspondence</li>
                <li>Ensuring security, preventing fraud, and troubleshooting system anomalies</li>
                <li>Providing customer service and support</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Sharing and Disclosure</h2>
              <p>
                We do not sell your personal data to third parties. We may share information with service providers
                acting on our behalf, in compliance with strict data processing agreements, or where required by
                applicable legal mandates or during critical corporate actions (such as a merger or acquisition).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
              <p>
                We employ industry-standard technical and organizational measures designed to secure your personal
                information from accidental loss and unauthorized access, use, alteration, and disclosure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Your Choices and Rights</h2>
              <p>
                Depending on your jurisdiction, you may have rights to access, correct, delete, or limit the use
                of your personal information. You can update your account settings directly within our application
                or by contacting support.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy, please reach out to us at:
                <br />
                <span className="font-semibold text-foreground">privacy@scrymechat.com</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
