interface BuildAffiliateUrlOptions {
  path: string
  organizationId?: string
  token?: string
  baseUrl?: string
  partial?: boolean
}

export const buildAffiliateUrl = ({
  path,
  organizationId,
  token,
  baseUrl,
  partial = false,
}: BuildAffiliateUrlOptions) => {
  const urlBase =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  // Affiliate pages are path-based on the main app host (and on *.vercel.app,
  // which the proxy never rewrites); only org custom domains use bare paths
  const getHost = (url?: string) => {
    try {
      return url ? new URL(url).host : null
    } catch {
      return null
    }
  }
  const baseHost = getHost(urlBase)
  const needsOrgPath =
    urlBase.includes("localhost:3000") ||
    urlBase === "https://refearnapp.com" ||
    baseHost === getHost(process.env.NEXT_PUBLIC_BASE_URL) ||
    !!baseHost?.endsWith(".vercel.app")
  let relativePath = needsOrgPath
    ? `/affiliate/${organizationId}/${path}`
    : `/${path}`

  if (token) {
    const separator = relativePath.includes("?") ? "&" : "?"
    relativePath += `${separator}affiliateToken=${token}`
  }
  return partial ? relativePath : `${urlBase}${relativePath}`
}
