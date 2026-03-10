import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type TrialEndingEmailProps = {
  ownerName: string;
  businessName: string;
  trialEndDate: string;
  pricingUrl: string;
};

export default function TrialEndingEmail({
  ownerName,
  businessName,
  trialEndDate,
  pricingUrl,
}: TrialEndingEmailProps) {
  const preview = `Your TideDesk trial ends soon – choose a plan to keep all features`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your trial is ending soon</Heading>
          <Text style={text}>Hi {ownerName},</Text>
          <Text style={text}>
            Your 30-day free trial for <strong>{businessName}</strong> ends on{" "}
            <strong>{trialEndDate}</strong>.
          </Text>
          <Text style={text}>
            To keep access to all features (export, weather alerts, SMS notifications, and more),
            choose a plan that works for you.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={pricingUrl}>
              View plans &amp; upgrade
            </Button>
          </Section>
          <Text style={textMuted}>
            You can upgrade or downgrade anytime from Settings → Billing. If you have questions,
            reply to this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1a1a2e",
  fontSize: "24px",
  marginBottom: "20px",
};

const text = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const textMuted = {
  color: "#718096",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "16px 0 0",
};

const buttonSection = {
  margin: "24px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  padding: "12px 24px",
  textDecoration: "none",
};
