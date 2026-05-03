"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { submitQuote } from "./actions";
import {
  MAX_FILE_BYTES,
  MAX_FILE_COUNT,
  SERVICE_OPTIONS,
  quoteSchema,
  type QuoteFormValues,
  type ServiceOption,
} from "./schema";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.dwg,.dxf,.zip,.txt";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
  });

  const selectedService = watch("serviceRequested");
  const showOtherService = selectedService === "Other";

  const onSubmit = async (data: QuoteFormValues) => {
    setServerError(null);

    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    if (data.phone) formData.set("phone", data.phone);
    if (data.company) formData.set("company", data.company);
    formData.set("serviceRequested", data.serviceRequested);
    if (data.otherService) formData.set("otherService", data.otherService);
    formData.set("projectDetails", data.projectDetails);

    const files = fileInputRef.current?.files;
    if (files) {
      for (const file of Array.from(files)) {
        formData.append("attachments", file);
      }
    }

    const token = await getRecaptchaToken("quote");
    formData.set("recaptchaToken", token);

    const result = await submitQuote(formData);
    if (result.ok) {
      setSubmitted(true);
      reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        <p className="mb-2 font-display text-xl text-ink-100">
          Request received!
        </p>
        <p className="font-text text-sm text-ink-300">
          Thank you for reaching out. We&apos;ll get back to you within one
          business day.
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

        <ServiceRadioGroup
          register={register("serviceRequested")}
          error={errors.serviceRequested?.message}
        />

        {showOtherService && (
          <FormField
            label="Other Service Requested"
            name="otherService"
            required
            error={errors.otherService?.message}
            helperText="Tell us what type of work you need."
          >
            <Input
              type="text"
              placeholder="e.g. specialty masking, custom finish…"
              {...register("otherService")}
            />
          </FormField>
        )}

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

        <div>
          <label
            htmlFor="attachments"
            className="block font-text text-sm font-semibold text-ink-100"
          >
            Upload your RFQ or project details
          </label>
          <p
            id="attachments-help"
            className="mt-1 mb-2 font-text text-xs text-ink-400"
          >
            Optional. Up to {MAX_FILE_COUNT} files,{" "}
            {(MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB each. PDFs,
            drawings, photos, spreadsheets.
          </p>
          <input
            ref={fileInputRef}
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={FILE_ACCEPT}
            aria-describedby="attachments-help"
            className="block w-full font-text text-sm text-ink-100 file:mr-4 file:rounded-sm file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:font-text file:text-sm file:font-semibold file:text-ink-100 hover:file:bg-ink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pops-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
          />
        </div>

        <div id="recaptcha-container" />

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit Request
        </Button>
      </form>
    </>
  );
}

type ServiceRadioGroupProps = {
  register: UseFormRegisterReturn;
  error?: string;
};

function ServiceRadioGroup({ register, error }: ServiceRadioGroupProps) {
  const errorId = "serviceRequested-error";
  return (
    <fieldset
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-2 block font-text text-sm font-semibold text-ink-100">
        Service Requested{" "}
        <span aria-hidden="true" className="text-pops-yellow-500">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </legend>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SERVICE_OPTIONS.map((option) => (
          <ServiceRadio key={option} option={option} register={register} />
        ))}
      </ul>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 font-text text-sm text-danger-400"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

type ServiceRadioProps = {
  option: ServiceOption;
  register: UseFormRegisterReturn;
};

function ServiceRadio({ option, register }: ServiceRadioProps) {
  const id = `service-${option.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <li>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border border-ink-600 bg-ink-700 px-4 py-2 font-text text-sm text-ink-100 transition-colors hover:border-ink-500 has-[:checked]:border-pops-yellow-500 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pops-yellow-300 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-ink-800"
      >
        <input
          id={id}
          type="radio"
          value={option}
          {...register}
          className="h-4 w-4 cursor-pointer accent-pops-yellow-500"
        />
        <span>{option}</span>
      </label>
    </li>
  );
}
