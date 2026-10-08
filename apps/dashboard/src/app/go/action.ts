"use server"

import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { and, eq } from "drizzle-orm"
import { UAParser } from "ua-parser-js"
import { db } from "@/db/drizzle"
import { affiliateClick, lead, referrals } from "@/db/schema"
import { handleAction } from "@/lib/handleAction"
import { AppError } from "@/lib/exceptions"
import { ActionResult } from "@/lib/types/organization/response"
import { leadSchema, LeadFormValues } from "@/lib/schema/leadSchema"
import { getLandingLink } from "@/lib/server/lead/getLandingLink"

const BOT_REGEX =
  /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|facebookcatalog/i

const cleanReferrer = (raw?: string) => {
  if (!raw) return "direct"
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return "unknown"
  }
}

export const recordLandingClick = async ({
  code,
  referrer,
}: {
  code: string
  referrer?: string
}): Promise<ActionResult<null>> => {
  return handleAction("Record Landing Click", async () => {
    const userAgent = (await headers()).get("user-agent") || ""
    if (BOT_REGEX.test(userAgent)) return { ok: true, data: null }

    const link = await getLandingLink(code)
    if (!link) return { ok: true, data: null }

    const { browser, os, device } = new UAParser(userAgent).getResult()
    await db.insert(affiliateClick).values({
      affiliateLinkId: link.linkId,
      referrer: cleanReferrer(referrer),
      deviceType: device.type || "desktop",
      browser: browser.name,
      os: os.name,
    })
    return { ok: true, data: null }
  })
}

export const submitLead = async ({
  code,
  ...values
}: LeadFormValues & { code: string }): Promise<
  ActionResult<{ redirectUrl: string }>
> => {
  return handleAction("Submit Lead", async () => {
    const parsed = leadSchema.safeParse(values)
    if (!parsed.success) {
      throw new AppError({
        status: 400,
        error: "Invalid lead data",
        toast: "Please check the form and try again.",
      })
    }
    const { name, phone } = parsed.data
    const email = parsed.data.email.toLowerCase()

    const link = await getLandingLink(code)
    if (!link) {
      throw new AppError({
        status: 404,
        error: "Invalid referral code",
        toast: "This referral link is no longer valid.",
      })
    }
    if (!link.leadRedirectUrl) {
      throw new AppError({
        status: 409,
        error: "Lead redirect URL not configured",
        toast: "This program is not ready yet. Please try again later.",
      })
    }

    const headerList = await headers()
    const leadId = randomUUID()
    const redirectUrl = new URL(link.leadRedirectUrl)
    redirectUrl.searchParams.set(link.referralParam ?? "ref", link.linkId)
    redirectUrl.searchParams.set("lead_id", leadId)

    await db.transaction(async (tx) => {
      // Reuse the referral row so a returning customer is not counted twice
      const existingReferral = await tx.query.referrals.findFirst({
        where: and(
          eq(referrals.signupEmail, email),
          eq(referrals.affiliateLinkId, link.linkId)
        ),
      })
      const referralId =
        existingReferral?.id ??
        (
          await tx
            .insert(referrals)
            .values({
              organizationId: link.organizationId,
              affiliateId: link.affiliateId,
              affiliateLinkId: link.linkId,
              signupEmail: email,
            })
            .returning({ id: referrals.id })
        )[0].id

      await tx.insert(lead).values({
        id: leadId,
        organizationId: link.organizationId,
        affiliateId: link.affiliateId,
        affiliateLinkId: link.linkId,
        referralId,
        name,
        email,
        phone,
        ipAddress: headerList.get("x-forwarded-for") || "unknown",
        userAgent: headerList.get("user-agent"),
        redirectedTo: redirectUrl.toString(),
      })
    })

    return { ok: true, data: { redirectUrl: redirectUrl.toString() } }
  })
}
