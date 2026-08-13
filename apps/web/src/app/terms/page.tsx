'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Last updated: January 15, 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert space-y-6 text-foreground/80 leading-relaxed">
            <p>
              Welcome to Scrymechat! These Terms of Service ("Terms") govern your access to and use of our enterprise communication platform,
              including our mobile application, web application, API, and related services (collectively, the "Services").
            </p>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By creating an account, logging in, or otherwise accessing or using our Services, you agree to be
                bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not use
                our Services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. Account Registration and Use</h2>
              <p>
                To access certain features of the Services, you must register for an account. You agree to provide
                accurate, complete, and current information during registration. You are solely responsible for maintaining
                the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Acceptable Use Policy</h2>
              <p>
                You agree not to use the Services for any unlawful or unauthorized purpose, or in any manner that
                violates these Terms. Prohibited conduct includes, but is not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Harassing, abusing, or harming other users of the Services</li>
                <li>Uploading, sending, or distributing defamatory, obscene, or infringing content</li>
                <li>Attempting to interfere with, disrupt, or compromise the security or integrity of our systems</li>
                <li>Using automated bots, scrapers, or other tools to access the Services without explicit authorization</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Intellectual Property</h2>
              <p>
                All rights, title, and interest in and to the Services, including our software, branding, logos,
                and intellectual property, are and will remain the exclusive property of Scrymechat and its licensors.
                Your use of the Services does not transfer any ownership rights to you.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Services at our sole discretion,
                without prior notice, for conduct that we believe violates these Terms or is harmful to other users,
                the public, or us.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Scrymechat shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, arising from your access or use of the Services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
              <p>
                If you have any questions or feedback regarding these Terms, please contact us at:
                <br />
                <span className="font-semibold text-foreground">support@scrymechat.com</span>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
