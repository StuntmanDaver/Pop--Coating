"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox } from "../../components/forms/checkbox";
import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { checkInSchema, type CheckInFormValues } from "./schema";

export function CheckInForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      safetyAcknowledged: false,
    },
  });

  const onSubmit = async (data: CheckInFormValues) => {
    // Server action wired in US-038
    console.log("Check-in form submitted:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
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
