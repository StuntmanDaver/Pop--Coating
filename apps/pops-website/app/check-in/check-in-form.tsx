"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox } from "../../components/forms/checkbox";
import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { submitCheckIn } from "./actions";
import { checkInSchema, type CheckInFormValues } from "./schema";

export function CheckInForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      safetyAcknowledged: false,
    },
  });

  const onSubmit = async (data: CheckInFormValues) => {
    setServerError(null);
    const result = await submitCheckIn(data);
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
        <p className="mb-2 font-display text-xl text-ink-100">You&apos;re checked in!</p>
        <p className="font-text text-sm text-ink-300">
          Welcome to Pop&apos;s Industrial Coatings. Please wait for your escort.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 font-text text-sm text-pops-yellow-500 underline hover:text-pops-yellow-300 transition-colors"
        >
          Submit another check-in
        </button>
      </div>
    );
  }

  return (
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

      <FormField label="Reason for Visit" name="reason" error={errors.reason?.message}>
        <Textarea
          id="reason"
          rows={3}
          {...register("reason")}
        />
      </FormField>

      {/* Safety acknowledgment checkbox */}
      <div>
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="safetyAcknowledged"
            render={({ field }) => (
              <Checkbox
                id="safetyAcknowledged"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={!!errors.safetyAcknowledged}
                aria-describedby={errors.safetyAcknowledged ? "safetyAcknowledged-error" : undefined}
              />
            )}
          />
          <label
            htmlFor="safetyAcknowledged"
            className="cursor-pointer pt-2 font-text text-sm leading-relaxed text-ink-200"
          >
            By checking this box, I acknowledge{" "}
            <Link
              href="/guest-safety-rules"
              className="text-pops-yellow-500 underline hover:text-pops-yellow-300 transition-colors"
            >
              Pop&apos;s Industrial Guest Safety Rules
            </Link>
            <span className="text-pops-yellow-500"> *</span>
          </label>
        </div>
        {errors.safetyAcknowledged && (
          <p id="safetyAcknowledged-error" className="mt-2 font-text text-sm text-danger-500">
            {errors.safetyAcknowledged.message}
          </p>
        )}
      </div>

      {/* reCAPTCHA placeholder — wired in US-039 */}
      <div id="recaptcha-container" />

      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
