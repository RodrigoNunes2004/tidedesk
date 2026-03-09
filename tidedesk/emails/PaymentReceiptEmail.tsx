import {
  Body,
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

export type PaymentReceiptEmailProps = EmailBaseProps & {
  customerName: string;
  amount: string;
  currency: string;
  itemDescription: string;
};

export default function PaymentReceiptEmail({
  lessonName,
  date,
  time,
  location,
  businessName,
  contactEmail,
  customerName,
  amount,
  currency,
  itemDescription,
}: PaymentReceiptEmailProps) {
  const preview = `${businessName}: Payment confirmed – ${amount} ${currency}`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment confirmed</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Your payment has been received. Here is your receipt:
          </Text>
          <Section style={details}>
            <Text style={detailRow}>
              <strong>Amount paid:</strong> {amount} {currency}
            </Text>
            <Text style={detailRow}>
              <strong>For:</strong> {itemDescription}
            </Text>
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
          </Section>
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
