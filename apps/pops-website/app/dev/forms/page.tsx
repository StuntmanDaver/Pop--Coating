import { Input } from "../../../components/forms/input";
import { Label } from "../../../components/forms/label";
import { Textarea } from "../../../components/forms/textarea";
import { Container } from "../../../components/layout/container";
import { Section } from "../../../components/layout/section";
import { EyebrowLabel } from "../../../components/marketing/eyebrow";

export const metadata = {
  title: "Dev — Form Primitives",
};

export default function DevFormsPage() {
  return (
    <Section tone="dark">
      <Container>
        <EyebrowLabel>Dev Preview</EyebrowLabel>
        <h1 className="font-display text-3xl mt-2 mb-8">Form primitives</h1>

        <div className="grid gap-12 max-w-xl">
          <section aria-labelledby="default-state">
            <h2
              id="default-state"
              className="font-text text-lg font-bold mb-4"
            >
              Default
            </h2>
            <div className="grid gap-6">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Jane Doe" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your project"
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="error-state">
            <h2
              id="error-state"
              className="font-text text-lg font-bold mb-4"
            >
              Error state (aria-invalid)
            </h2>
            <div className="grid gap-6">
              <div>
                <Label htmlFor="email-error">
                  Email
                  <span className="text-pops-yellow-500"> *</span>
                </Label>
                <Input
                  id="email-error"
                  name="email-error"
                  type="email"
                  defaultValue="not-an-email"
                  aria-invalid="true"
                  aria-describedby="email-error-help"
                />
                <p
                  id="email-error-help"
                  className="mt-2 text-sm text-danger-500"
                >
                  Enter a valid email address.
                </p>
              </div>
              <div>
                <Label htmlFor="msg-error">
                  Project details
                  <span className="text-pops-yellow-500"> *</span>
                </Label>
                <Textarea
                  id="msg-error"
                  name="msg-error"
                  data-error="true"
                  defaultValue=""
                  aria-describedby="msg-error-help"
                />
                <p
                  id="msg-error-help"
                  className="mt-2 text-sm text-danger-500"
                >
                  Project details are required.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="disabled-state">
            <h2
              id="disabled-state"
              className="font-text text-lg font-bold mb-4"
            >
              Disabled
            </h2>
            <div className="grid gap-6">
              <div>
                <Label htmlFor="disabled-input">Read-only field</Label>
                <Input
                  id="disabled-input"
                  name="disabled-input"
                  defaultValue="Locked"
                  disabled
                />
              </div>
            </div>
          </section>
        </div>
      </Container>
    </Section>
  );
}
