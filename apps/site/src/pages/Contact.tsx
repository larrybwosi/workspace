import { Helmet } from 'react-helmet-async';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { useState } from 'react';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v2/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Failed to submit contact form', err);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Workspace</title>
        <meta name="description" content="Have questions? We're here to help. Get in touch with the Workspace team." />
      </Helmet>
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Get in touch</h1>
            <p className="text-slate-500">Fill out the form below and we'll get back to you as soon as possible.</p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-2xl text-center">
              <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
              <p>Thank you for reaching out. Our team will contact you shortly.</p>
              <Button className="mt-6" onClick={() => setSubmitted(false)}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input name="firstName" placeholder="Jane" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input name="lastName" placeholder="Doe" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Work Email</label>
                <Input name="email" type="email" placeholder="jane@company.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea name="message" placeholder="How can we help you?" className="min-h-[150px]" required />
              </div>
              <Button type="submit" className="w-full h-12 text-lg">Send Message</Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
