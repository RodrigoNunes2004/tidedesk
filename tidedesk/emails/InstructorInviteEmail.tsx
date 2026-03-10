import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type InstructorInviteEmailProps = {
  businessName: string;
  inviteUrl: string;
  expiresInDays: number;
};

export default function InstructorInviteEmail({
  businessName,
  inviteUrl,
  expiresInDays,
}: InstructorInviteEmailProps) {
  const preview = `You're invited to join ${businessName} on TideDesk`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re invited to TideDesk</Heading>
          <Text style={text}>
            <strong>{businessName}</strong> has invited you to join their team as an instructor.
          </Text>
          <Text style={text}>
            Click the button below to set your password and activate your account. You&apos;ll be able to
            view bookings, customers, and lessons assigned to you.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href={inviteUrl}>
              Set your password
            </Button>
          </Section>
          <Text style={textMuted}>
            This link expires in {expiresInDays} days. If you didn&apos;t expect this invite, you can safely
            ignore this email.
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
