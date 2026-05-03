"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { contactSchema, type ContactFormValues } from "./schema";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
    // Server action wired in US-037
    console.log("Contact form submitted:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
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

      {/* reCAPTCHA placeholder — wired in US-039 */}
      <div id="recaptcha-container" />

      <Button type="submit" variant="primary" isLoading={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
