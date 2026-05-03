"use client";

import { useState } from "react";
import Script from "next/script";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { submitContact } from "./actions";
import { contactSchema, type ContactFormValues } from "./schema";

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

export function ContactForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    setServerError(null);
    const token = await getRecaptchaToken("contact");
    const result = await submitContact(data, token);
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
        <p className="mb-2 font-display text-xl text-ink-100">Message sent!</p>
        <p className="font-text text-sm text-ink-300">
          Thank you for reaching out. We&apos;ll respond within one business day.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 font-text text-sm text-pops-yellow-500 underline hover:text-pops-yellow-300 transition-colors"
        >
          Send another message
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

        <FormField label="Name" name="name" required error={errors.name?.message}>
          <Input
            id="name"
            {...register("name")}
            aria-invalid={!!errors.name}
            autoComplete="name"
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

        <FormField label="Message" name="message" required error={errors.message?.message}>
          <Textarea
            id="message"
            rows={6}
            {...register("message")}
            aria-invalid={!!errors.message}
          />
        </FormField>

        <div id="recaptcha-container" />

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit
        </Button>
      </form>
    </>
  );
}
