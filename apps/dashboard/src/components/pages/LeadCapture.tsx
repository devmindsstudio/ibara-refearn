"use client"
import React, { useEffect } from "react"
import { ArrowRight, Loader2, Mail, Phone, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { InputField } from "@/components/Auth/FormFields"
import { LeadFormValues, leadSchema } from "@/lib/schema/leadSchema"
import { useAppMutation } from "@/hooks/useAppMutation"
import { recordLandingClick, submitLead } from "@/app/go/action"

type Props = {
  code: string
  orgName: string
  logoUrl: string | null
  affiliateName: string
}

const LeadCapture = ({ code, orgName, logoUrl, affiliateName }: Props) => {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "" },
  })

  // Count one click per browser session, not on every refresh
  useEffect(() => {
    const key = `lead_click_${code}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {}
    void recordLandingClick({ code, referrer: document.referrer })
  }, [code])

  const mutation = useAppMutation(submitLead, {
    affiliate: false,
    disableSuccessToast: true,
    enableRedirect: false,
    onSuccess: (res) => {
      if (res.ok) window.location.assign(res.data.redirectUrl)
    },
  })
  const isRedirecting = mutation.isPending || mutation.data?.ok

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={orgName}
              className="mx-auto h-12 w-12 rounded-md object-contain"
            />
          )}
          <h1 className="text-2xl font-bold">Continue to {orgName}</h1>
          <p className="text-sm text-muted-foreground">
            Recommended by {affiliateName}. Enter your details to proceed.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                mutation.mutate({ ...data, code })
              )}
              className="space-y-4"
            >
              <InputField
                control={form.control}
                name="name"
                label="Full name"
                placeholder="John Doe"
                type="text"
                icon={User}
                affiliate={false}
              />
              <InputField
                control={form.control}
                name="email"
                label="Email"
                placeholder="john@example.com"
                type="email"
                icon={Mail}
                affiliate={false}
              />
              <InputField
                control={form.control}
                name="phone"
                label="Phone number"
                placeholder="+971 50 123 4567"
                type="text"
                icon={Phone}
                affiliate={false}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isRedirecting}
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Proceed
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
export default LeadCapture
