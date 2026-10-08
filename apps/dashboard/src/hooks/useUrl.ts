"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isMainAppHost } from "@/util/Url"

export function useAffiliatePath(orgId?: string) {
  const router = useRouter()
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [isMainHost, setIsMainHost] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentBase = `${window.location.protocol}//${window.location.host}`
      setBaseUrl(currentBase)
      setIsMainHost(isMainAppHost(window.location.host))
    }
  }, [])

  function getPath(path: string) {
    if (!baseUrl) return path
    if (isMainHost && orgId) return `/affiliate/${orgId}/${path}`
    return `/${path}`
  }

  function goTo(path: string) {
    router.push(getPath(path))
  }

  return { goTo, getPath, isMainHost, baseUrl }
}
