import React from "react"
import type { Metadata } from "next"
import { buildMetadata } from "@/util/BuildMetadata"
import { getLandingLink } from "@/lib/server/lead/getLandingLink"
import { ErrorCard } from "@/components/ui-custom/ErrorCard"
import LeadCapture from "@/components/pages/LeadCapture"

export const metadata: Metadata = buildMetadata({
  title: "Continue",
  description: "Enter your details to continue",
  indexable: false,
})

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const REF_KEYS = ["ref", "aff", "via"] as const

const GoPage = async ({ searchParams }: Props) => {
  const params = await searchParams
  const code = REF_KEYS.map((k) => params[k]).find(
    (v): v is string => typeof v === "string" && v.length > 0
  )
  const link = code ? await getLandingLink(code) : null

  if (!code || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorCard message="This referral link is invalid or has expired." />
      </div>
    )
  }
  return (
    <LeadCapture
      code={link.linkId}
      orgName={link.orgName}
      logoUrl={link.logoUrl}
      affiliateName={link.affiliateName}
    />
  )
}
export default GoPage
