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

export type BookingConfirmationEmailProps = EmailBaseProps & {
  customerName: string;
  participants: number;
  paymentStatus: string;
  bookingId: string;
  rescheduleUrl?: string;
};

export default function BookingConfirmationEmail({
  lessonName,
  date,
  time,
  location,
  businessName,
  contactEmail,
  customerName,
  participants,
  paymentStatus,
  rescheduleUrl,
}: BookingConfirmationEmailProps) {
  const preview = `${businessName}: Your ${lessonName} is confirmed for ${date} at ${time}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking confirmed</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Your surf lesson is confirmed. Here are the details:
          </Text>
          <Section style={details}>
            <Text style={detailRow}>
              <strong>Lesson:</strong> {lessonName}
            </Text>
            <Text style={detailRow}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={detailRow}>
              <strong>Time:</strong> {time}
            </Text>
            <Text style={detailRow}>
              <strong>Location:</strong> {location}
            </Text>
            <Text style={detailRow}>
              <strong>Participants:</strong> {participants}
            </Text>
            <Text style={detailRow}>
              <strong>Payment:</strong> {paymentStatus}
            </Text>
          </Section>
          {rescheduleUrl && (
            <Section style={buttonSection}>
              <Button style={button} href={rescheduleUrl}>
                Reschedule or manage booking
              </Button>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Questions? Contact {businessName} at{" "}
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
  color: "#1a1a2e",
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
  backgroundColor: "#f8fafc",
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
