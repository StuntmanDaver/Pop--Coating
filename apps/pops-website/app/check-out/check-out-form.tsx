"use client";

import { useState } from "react";
import Script from "next/script";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Button } from "../../components/ui/button";
import { submitCheckOut } from "./actions";
import { checkOutSchema, type CheckOutFormValues } from "./schema";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

async function getRecaptchaToken(action: string): Promise<string> {
  if (!SITE_KEY) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (window as any).grecaptcha;
  if (!g) return "";
  return new Promise<string>((resolve, reject) => {
    g.ready(() => g.execute(SITE_KEY, { action }).then(resolve, reject));
  });
}

export function CheckOutForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckOutFormValues>({
    resolver: zodResolver(checkOutSchema),
  });

  const onSubmit = async (data: CheckOutFormValues) => {
    setServerError(null);
    const token = await getRecaptchaToken("check_out");
    const result = await submitCheckOut(data, token);
    if (result.ok) {
      setSubmitted(true);
      reset();
    } else if ("serverError" in result) {
      setServerError(result.serverError);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-sm border border-pops-yellow-500 bg-pops-yellow-500/10 p-6 text-center"
      >
        <p className="mb-2 font-display text-xl text-ink-100">You&apos;re checked out!</p>
        <p className="font-text text-sm text-ink-300">
          Thank you for visiting Pop&apos;s Industrial Coatings. Drive safe!
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 font-text text-sm text-pops-yellow-500 underline hover:text-pops-yellow-300 transition-colors"
        >
          Submit another check-out
        </button>
      </div>
    );
  }

  return (
    <>
      {SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
          strategy="lazyOnload"
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {serverError && (
          <div
            role="alert"
            className="rounded-sm border border-danger-500 bg-danger-500/10 p-4 font-text text-sm text-danger-400"
          >
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField label="First Name" name="firstName" required error={errors.firstName?.message}>
            <Input
              id="firstName"
              {...register("firstName")}
              aria-invalid={!!errors.firstName}
              autoComplete="given-name"
            />
          </FormField>

          <FormField label="Last Name" name="lastName" required error={errors.lastName?.message}>
            <Input
              id="lastName"
              {...register("lastName")}
              aria-invalid={!!errors.lastName}
              autoComplete="family-name"
            />
          </FormField>

          <FormField label="Company Name" name="companyName" error={errors.companyName?.message}>
            <Input
              id="companyName"
              {...register("companyName")}
              autoComplete="organization"
            />
          </FormField>

          <FormField label="Email" name="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              autoComplete="email"
            />
          </FormField>

          <FormField label="Phone" name="phone" required error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              aria-invalid={!!errors.phone}
              autoComplete="tel"
            />
          </FormField>
        </div>

        <div id="recaptcha-container" />

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit
        </Button>
      </form>
    </>
  );
}
