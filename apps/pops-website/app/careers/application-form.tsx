"use client";

import { useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Checkbox } from "../../components/forms/checkbox";
import { FormField } from "../../components/forms/form-field";
import { Input } from "../../components/forms/input";
import { Textarea } from "../../components/forms/textarea";
import { Button } from "../../components/ui/button";
import { submitJobApplication } from "./actions";
import {
  JOB_APPLICATION_POSITIONS,
  jobApplicationSchema,
  type JobApplicationFormInput,
  type JobApplicationFormValues,
} from "./schema";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

type RecaptchaApi = {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

async function getRecaptchaToken(action: string): Promise<string> {
  if (!SITE_KEY) return "";
  const g = (window as Window & { grecaptcha?: RecaptchaApi }).grecaptcha;
  if (!g) return "";
  return new Promise<string>((resolve, reject) => {
    g.ready(() => g.execute(SITE_KEY, { action }).then(resolve, reject));
  });
}

export function JobApplicationForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const resumeRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationFormInput, unknown, JobApplicationFormValues>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      phone: "",
      positionInterests: [],
    },
  });

  const onSubmit = async (data: JobApplicationFormValues) => {
    setServerError(null);
    const file = resumeRef.current?.files?.[0];
    if (!file) {
      setServerError("Please attach your resume (PDF or Word).");
      return;
    }

    const token = await getRecaptchaToken("careers");
    const fd = new FormData();
    fd.set("name", data.name);
    fd.set("email", data.email);
    if (data.phone) fd.set("phone", data.phone);
    fd.set("message", data.message);
    for (const p of data.positionInterests) {
      fd.append("positionInterests", p);
    }
    fd.set("resume", file);

    const result = await submitJobApplication(fd, token);
    if (result.ok) {
      setSubmitted(true);
      reset();
      if (resumeRef.current) resumeRef.current.value = "";
    } else if ("serverError" in result) {
      setServerError(result.serverError);
    } else if ("fieldErrors" in result) {
      for (const [key, messages] of Object.entries(result.fieldErrors)) {
        const msg = messages?.[0];
        if (msg) {
          setError(key as keyof JobApplicationFormValues, { type: "server", message: msg });
        }
      }
    }
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-sm border border-pops-yellow-500 bg-pops-yellow-500/10 p-6 text-center"
      >
        <p className="mb-2 font-display text-xl text-ink-100">Application received</p>
        <p className="font-text text-sm text-ink-300">
          Thank you for your interest. If your background matches our needs, we&apos;ll reach out
          within a few business days.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 font-text text-sm text-pops-yellow-500 underline transition-colors hover:text-pops-yellow-300"
        >
          Submit another application
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

      <p className="mb-6 font-text text-sm leading-relaxed text-ink-300">
        Fields marked with <span className="text-pops-yellow-500">*</span> are required.
      </p>

      <form onSubmit={onFormSubmit} noValidate className="space-y-6">
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

        <FormField label="Phone" name="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            aria-invalid={!!errors.phone}
            autoComplete="tel"
          />
        </FormField>

        <fieldset className="space-y-3">
          <legend className="mb-1 font-text text-sm font-medium text-ink-100">
            Position(s) you&apos;re applying for{" "}
            <span className="text-pops-yellow-500" aria-hidden="true">
              *
            </span>
          </legend>
          <p className="mb-2 font-text text-xs text-ink-400">Select all that apply.</p>
          <Controller
            control={control}
            name="positionInterests"
            render={({ field }) => (
              <div
                className="space-y-3 rounded-sm border border-white/10 bg-[#0A0A0A]/50 p-4"
                role="group"
                aria-label="Positions"
              >
                {JOB_APPLICATION_POSITIONS.map((position) => (
                  <label
                    key={position}
                    className="flex cursor-pointer items-start gap-3 font-text text-sm text-ink-100"
                  >
                    <Checkbox
                      checked={field.value?.includes(position)}
                      onCheckedChange={(checked) => {
                        const v = field.value ?? [];
                        if (checked === true) {
                          field.onChange([...v, position]);
                        } else {
                          field.onChange(v.filter((x) => x !== position));
                        }
                      }}
                      className="mt-0.5 shrink-0"
                      aria-invalid={!!errors.positionInterests}
                    />
                    <span className="pt-2 leading-snug">{position}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.positionInterests?.message ? (
            <p className="font-text text-sm text-danger-400" role="alert">
              {errors.positionInterests.message}
            </p>
          ) : null}
        </fieldset>

        <FormField
          label="Resume"
          name="resume"
          required
          helperText="PDF or Word (.doc, .docx), up to 10 MB."
        >
          <Input
            id="resume"
            ref={resumeRef}
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="cursor-pointer pt-2.5 file:mr-4 file:rounded-sm file:border-0 file:bg-pops-yellow-500 file:px-4 file:py-2 file:font-text file:text-sm file:font-semibold file:text-black hover:file:bg-pops-yellow-300"
          />
        </FormField>

        <FormField
          label="Experience & availability"
          name="message"
          required
          error={errors.message?.message}
        >
          <Textarea
            id="message"
            rows={6}
            {...register("message")}
            aria-invalid={!!errors.message}
            placeholder="Brief work history, certifications, when you can start — if you chose Other, describe the role here."
          />
        </FormField>

        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Submit application
        </Button>
      </form>
    </>
  );
}
