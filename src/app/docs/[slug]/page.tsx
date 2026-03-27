"use client"

import { useParams, useRouter } from "next/navigation"
import { docs } from "@/lib/docs-data"
import { MDXRemote } from "next-mdx-remote/rsc"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"

export default function DocPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()

  const currentDoc = docs.find((doc) => doc.slug === slug)
  const currentIndex = docs.findIndex((doc) => doc.slug === slug)
  const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null
  const nextDoc = currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null

  if (!currentDoc) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/docs"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Docs
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{currentDoc.title}</h1>
          <p className="text-lg text-muted-foreground">{currentDoc.description}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none mb-12">
          <MDXRemote source={currentDoc.content} />
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-8">
          {prevDoc ? (
            <Link href={`/docs/${prevDoc.slug}`} className="group">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <ChevronLeft className="w-4 h-4 mr-2" />
                {prevDoc.title}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          {nextDoc ? (
            <Link href={`/docs/${nextDoc.slug}`} className="group">
              <Button variant="outline" className="w-full justify-end bg-transparent">
                {nextDoc.title}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  )
}
