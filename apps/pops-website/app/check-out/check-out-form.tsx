"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Button } from "../../components/ui/button";
import { checkOutSchema, type CheckOutFormValues } from "./schema";

export function CheckOutForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckOutFormValues>({
    resolver: zodResolver(checkOutSchema),
  });

  const onSubmit = async (data: CheckOutFormValues) => {
    // Server action wired in US-038
    console.log("Check-out form submitted:", data);
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

      {/* reCAPTCHA placeholder — wired in US-039 */}
      <div id="recaptcha-container" />

      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
