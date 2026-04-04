"use client"

import { useRouter } from "next/navigation"
import { docs } from "@/lib/docs-data"
import { ChevronRight, BookOpen } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Learn how to use our platform, integrate external systems, and manage your projects effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="group p-6 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{doc.title}</h2>
              <p className="text-muted-foreground text-sm">{doc.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
