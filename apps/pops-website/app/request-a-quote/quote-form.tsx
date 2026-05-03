"use client";

import { useState } from "react";
import Script from "next/script";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { submitQuote } from "./actions";
import { quoteSchema, type QuoteFormValues } from "./schema";

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

export function QuoteForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
  });

  const onSubmit = async (data: QuoteFormValues) => {
    setServerError(null);
    const token = await getRecaptchaToken("quote");
    const result = await submitQuote(data, token);
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
        <p className="mb-2 font-display text-xl text-ink-100">Request received!</p>
        <p className="font-text text-sm text-ink-300">
          Thank you for reaching out. We&apos;ll get back to you within one business day.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 font-text text-sm text-pops-yellow-500 underline hover:text-pops-yellow-300 transition-colors"
        >
          Submit another request
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
          <FormField label="Full Name" name="name" required error={errors.name?.message}>
            <Input
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              {...register("name")}
            />
          </FormField>

          <FormField label="Email Address" name="email" required error={errors.email?.message}>
            <Input
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              {...register("email")}
            />
          </FormField>

          <FormField label="Phone Number" name="phone" error={errors.phone?.message}>
            <Input
              type="tel"
              placeholder="(863) 000-0000"
              autoComplete="tel"
              {...register("phone")}
            />
          </FormField>

          <FormField label="Company" name="company" error={errors.company?.message}>
            <Input
              type="text"
              placeholder="Your company name"
              autoComplete="organization"
              {...register("company")}
            />
          </FormField>
        </div>

        <FormField
          label="Project Details"
          name="projectDetails"
          required
          error={errors.projectDetails?.message}
          helperText="Describe the scope, materials, quantities, and any specifications."
        >
          <Textarea
            rows={6}
            placeholder="Tell us about your project…"
            {...register("projectDetails")}
          />
        </FormField>

        <div id="recaptcha-container" />

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit Request
        </Button>
      </form>
    </>
  );
}
