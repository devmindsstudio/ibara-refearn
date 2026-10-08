import { db } from "@/db/drizzle"
import { affiliate, affiliateLink, organization } from "@/db/schema"
import { and, eq } from "drizzle-orm"

/**
 * Resolves a referral code from an influencer link to its program.
 * Returns null for unknown codes or inactive affiliates.
 */
export const getLandingLink = async (code: string) => {
  const [row] = await db
    .select({
      linkId: affiliateLink.id,
      affiliateId: affiliate.id,
      affiliateName: affiliate.name,
      organizationId: organization.id,
      orgName: organization.name,
      logoUrl: organization.logoUrl,
      referralParam: organization.referralParam,
      leadRedirectUrl: organization.leadRedirectUrl,
    })
    .from(affiliateLink)
    .innerJoin(affiliate, eq(affiliate.id, affiliateLink.affiliateId))
    .innerJoin(organization, eq(organization.id, affiliateLink.organizationId))
    .where(and(eq(affiliateLink.id, code), eq(affiliate.status, "active")))
    .limit(1)

  return row ?? null
}
