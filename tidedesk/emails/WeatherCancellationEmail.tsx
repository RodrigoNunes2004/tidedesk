import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { EmailBaseProps } from "./shared";

export type WeatherCancellationEmailProps = EmailBaseProps & {
  customerName: string;
  reason?: string;
  rescheduleUrl?: string;
};

export default function WeatherCancellationEmail({
  lessonName,
  date,
  time,
  location,
  businessName,
  contactEmail,
  customerName,
  reason,
  rescheduleUrl,
}: WeatherCancellationEmailProps) {
  const preview = `${businessName}: Lesson cancelled due to weather – ${lessonName} on ${date}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Lesson cancelled</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            We regret to inform you that your surf lesson has been cancelled due
            to unsafe weather conditions.
          </Text>
          <Section style={details}>
            <Text style={detailRow}>
              <strong>Cancelled lesson:</strong> {lessonName}
            </Text>
            <Text style={detailRow}>
              <strong>Was scheduled for:</strong> {date} at {time}
            </Text>
            <Text style={detailRow}>
              <strong>Location:</strong> {location}
            </Text>
            {reason && (
              <Text style={detailRow}>
                <strong>Reason:</strong> {reason}
              </Text>
            )}
          </Section>
          {rescheduleUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={rescheduleUrl}>
                Reschedule your lesson
              </Button>
              <Text style={text}>
                Click the button above to book a new time that works for you.
              </Text>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Questions or need help rescheduling? Contact {businessName} at{" "}
            <Link href={`mailto:${contactEmail}`} style={link}>
              {contactEmail}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const h1 = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "600",
  margin: "0 0 24px",
};

const text = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const details = {
  backgroundColor: "#fef2f2",
  padding: "20px",
  borderRadius: "6px",
  margin: "24px 0",
};

const detailRow = {
  color: "#2d3748",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "8px 0",
};

const buttonSection = {
  margin: "24px 0",
};

const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const footer = {
  color: "#718096",
  fontSize: "14px",
  lineHeight: "20px",
};

const link = {
  color: "#0ea5e9",
  textDecoration: "underline",
};
