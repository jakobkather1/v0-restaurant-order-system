"use client"

import { Info } from "lucide-react"

interface InfoSectionProps {
  text: string
  textColor?: string
}

export function InfoSection({ text, textColor = "#1f2937" }: InfoSectionProps) {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 items-start">
          <Info 
            className="h-5 w-5 flex-shrink-0 mt-0.5" 
            style={{ color: textColor }}
          />
          <p className="whitespace-pre-line text-left" style={{ color: textColor }}>{text}</p>
        </div>
      </div>
    </section>
  )
}
