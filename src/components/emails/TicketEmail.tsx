import * as React from 'react';
import { 
  Html, Head, Body, Container, Section, Text, Hr, Row, Column 
} from '@react-email/components';

interface TicketEmailProps {
  orderId: string;
  customerName: string;
  departureDate: string;
  cabinClass: string;
  paxCount: number;
  pickupLocation: string;
}

export const TicketEmail: React.FC<TicketEmailProps> = ({
  orderId,
  customerName,
  departureDate,
  cabinClass,
  paxCount,
  pickupLocation
}) => {
  // Format Tanggal
  const formattedDate = new Date(departureDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          
          {/* Header E-Ticket */}
          <Section style={headerSection}>
            <Text style={logoText}>PMM <span style={{color: '#D4AF37'}}>RESERVE</span></Text>
            <Text style={headerTitle}>BOARDING PASS & E-TICKET</Text>
          </Section>

          {/* Konten Utama */}
          <Section style={contentSection}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              Thank you for choosing PMM Voyage for your expedition. Your payment has been successfully confirmed. Please present this e-Ticket during pickup or boarding.
            </Text>

            {/* Kotak Info Tiket */}
            <Section style={ticketBox}>
              <Row>
                <Column>
                  <Text style={label}>BOOKING REF</Text>
                  <Text style={valueHighlight}>{orderId}</Text>
                </Column>
                <Column>
                  <Text style={label}>ROUTE</Text>
                  <Text style={value}>Lombok ➔ Komodo</Text>
                </Column>
              </Row>
              
              <Hr style={divider} />
              
              <Row>
                <Column>
                  <Text style={label}>DEPARTURE DATE</Text>
                  <Text style={value}>{formattedDate}</Text>
                </Column>
                <Column>
                  <Text style={label}>CLASS & GUESTS</Text>
                  <Text style={value}>{cabinClass} - {paxCount} Pax</Text>
                </Column>
              </Row>

              <Hr style={divider} />

              <Row>
                <Column>
                  <Text style={label}>PICKUP LOCATION</Text>
                  <Text style={value}>{pickupLocation}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              <strong>Important Notes:</strong><br/>
              • Please be ready at your pickup location 30 minutes before the scheduled time.<br/>
              • Bring your original passport as it is required for harbor clearance.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              PMM Voyage Liveaboard | Secure & Luxury Expeditions<br/>
              Need help? Contact us via WhatsApp or reply to this email.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

// --- STYLING BERBASIS OBJEK (Standard React Email) ---
const main = {
  backgroundColor: '#F8F9FA',
  fontFamily: 'Arial, sans-serif',
  padding: '40px 0',
};
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  borderRadius: '16px',
  overflow: 'hidden',
  maxWidth: '600px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
};
const headerSection = {
  backgroundColor: '#0B192C',
  padding: '40px 30px',
  textAlign: 'center' as const,
};
const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  margin: '0 0 10px 0',
};
const headerTitle = {
  color: '#D4AF37',
  fontSize: '14px',
  letterSpacing: '2px',
  margin: '0',
};
const contentSection = {
  padding: '40px 30px',
};
const greeting = {
  fontSize: '18px',
  color: '#0B192C',
  fontWeight: 'bold',
  marginBottom: '10px',
};
const paragraph = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '1.6',
  marginBottom: '24px',
};
const ticketBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
};
const label = {
  fontSize: '10px',
  color: '#6b7280',
  fontWeight: 'bold',
  letterSpacing: '1px',
  margin: '0 0 4px 0',
};
const value = {
  fontSize: '14px',
  color: '#0B192C',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};
const valueHighlight = {
  fontSize: '16px',
  color: '#D4AF37',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};
const divider = {
  borderColor: '#e5e7eb',
  margin: '0 0 16px 0',
};
const footerSection = {
  backgroundColor: '#0B192C',
  padding: '24px',
  textAlign: 'center' as const,
};
const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
};