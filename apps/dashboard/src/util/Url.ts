interface BuildAffiliateUrlOptions {
  path: string
  organizationId?: string
  token?: string
  baseUrl?: string
  partial?: boolean
}

const getHost = (url?: string) => {
  try {
    return url ? new URL(url).host : null
  } catch {
    return null
  }
}

/**
 * Affiliate pages are served under /affiliate/{orgId} on the main app host
 * (and on *.vercel.app, which the proxy never rewrites). Only an org's own
 * domain is rewritten by the proxy and uses bare paths.
 */
export const isMainAppHost = (host?: string | null) =>
  !!host &&
  (host.includes("localhost:3000") ||
    host === "refearnapp.com" ||
    host === getHost(process.env.NEXT_PUBLIC_BASE_URL) ||
    host.endsWith(".vercel.app"))

export const buildAffiliateUrl = ({
  path,
  organizationId,
  token,
  baseUrl,
  partial = false,
}: BuildAffiliateUrlOptions) => {
  const urlBase =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const needsOrgPath = isMainAppHost(getHost(urlBase))
  let relativePath = needsOrgPath
    ? `/affiliate/${organizationId}/${path}`
    : `/${path}`

  if (token) {
    const separator = relativePath.includes("?") ? "&" : "?"
    relativePath += `${separator}affiliateToken=${token}`
  }
  return partial ? relativePath : `${urlBase}${relativePath}`
}
