import { redirect } from "next/navigation"
import Home from "@/components/pages/Home"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const homePage = async ({ searchParams }: Props) => {
  // Influencer links (https://{websiteUrl}?ref=CODE) land on the lead form
  const params = await searchParams
  for (const key of ["ref", "aff", "via"]) {
    const code = params[key]
    if (typeof code === "string" && code) {
      redirect(`/go?${key}=${encodeURIComponent(code)}`)
    }
  }
  return (
    <>
      <Home />
    </>
  )
}
export default homePage
