"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { quoteSchema, type QuoteFormValues } from "./schema";

export function QuoteForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
  });

  function onSubmit(data: QuoteFormValues) {
    // Server action wires up in US-036
    console.log("Quote form submitted:", data);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
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

      {/* reCAPTCHA v3 placeholder — wired up in US-039 */}
      <div id="recaptcha-container" />

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
      >
        Submit Request
      </Button>
    </form>
  );
}
