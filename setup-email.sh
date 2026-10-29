#!/bin/bash
# AgriConnect Email Service Setup Script
# Configures email notifications using SendGrid/SMTP

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📧 AgriConnect Email Service Setup${NC}"
echo "===================================="

# Configuration
PROJECT_DIR="/var/www/agriconnect"
ENV_FILE="$PROJECT_DIR/backend/.env.production"

echo ""
echo "Choose email provider:"
echo "1) SendGrid (Recommended - Free tier: 100 emails/day)"
echo "2) AWS SES (High volume - Requires AWS account)"
echo "3) Custom SMTP (Gmail, Outlook, etc.)"
echo ""
read -p "Enter choice (1-3): " PROVIDER_CHOICE

case $PROVIDER_CHOICE in
    1)
        PROVIDER="sendgrid"
        echo ""
        echo -e "${YELLOW}📝 SendGrid Setup Instructions:${NC}"
        echo "1. Create account at https://sendgrid.com"
        echo "2. Verify your sender email"
        echo "3. Generate API key in Settings > API Keys"
        echo ""
        read -p "Enter SendGrid API Key: " API_KEY
        
        SMTP_HOST="smtp.sendgrid.net"
        SMTP_PORT="587"
        SMTP_USER="apikey"
        SMTP_PASSWORD="$API_KEY"
        ;;
    2)
        PROVIDER="ses"
        echo ""
        echo -e "${YELLOW}📝 AWS SES Setup Instructions:${NC}"
        echo "1. Configure AWS SES in your region"
        echo "2. Verify email addresses"
        echo "3. Create SMTP credentials"
        echo ""
        read -p "Enter AWS SES SMTP Username: " SMTP_USER
        read -p "Enter AWS SES SMTP Password: " SMTP_PASSWORD
        read -p "Enter AWS Region (e.g., us-east-1): " AWS_REGION
        
        SMTP_HOST="email-smtp.$AWS_REGION.amazonaws.com"
        SMTP_PORT="587"
        ;;
    3)
        PROVIDER="smtp"
        echo ""
        read -p "Enter SMTP Host: " SMTP_HOST
        read -p "Enter SMTP Port (usually 587): " SMTP_PORT
        read -p "Enter SMTP Username: " SMTP_USER
        read -p "Enter SMTP Password: " SMTP_PASSWORD
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
read -p "Enter FROM email address: " FROM_EMAIL
read -p "Enter FROM name (e.g., AgriConnect): " FROM_NAME

# Install email package
echo -e "${YELLOW}📦 Installing nodemailer...${NC}"
cd "$PROJECT_DIR/backend"
npm install nodemailer --save
echo -e "${GREEN}✅ Nodemailer installed${NC}"

# Update environment variables
echo -e "${YELLOW}⚙️  Updating environment variables...${NC}"
sed -i "s/EMAIL_ENABLED=.*/EMAIL_ENABLED=true/" "$ENV_FILE"
sed -i "s|SMTP_HOST=.*|SMTP_HOST=$SMTP_HOST|" "$ENV_FILE"
sed -i "s/SMTP_PORT=.*/SMTP_PORT=$SMTP_PORT/" "$ENV_FILE"
sed -i "s/SMTP_USER=.*/SMTP_USER=$SMTP_USER/" "$ENV_FILE"
sed -i "s|SMTP_PASSWORD=.*|SMTP_PASSWORD=$SMTP_PASSWORD|" "$ENV_FILE"
sed -i "s|SMTP_FROM=.*|SMTP_FROM=$FROM_NAME <$FROM_EMAIL>|" "$ENV_FILE"
echo -e "${GREEN}✅ Environment updated${NC}"

# Create email service
echo -e "${YELLOW}📝 Creating email service...${NC}"
cat > "$PROJECT_DIR/backend/src/services/email.js" << 'EMAIL_EOF'
/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email disabled - Would send:', { to, subject });
    return { success: true, disabled: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to AgriConnect! 🌾';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to AgriConnect!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Thank you for joining AgriConnect, Ethiopia's leading agricultural marketplace connecting farmers and buyers.</p>
        <p><strong>Your Account Details:</strong></p>
        <ul>
          <li>Phone: ${user.phone_number}</li>
          <li>Role: ${user.role}</li>
          ${user.email ? `<li>Email: ${user.email}</li>` : ''}
        </ul>
        <p>You can now:</p>
        <ul>
          <li>Browse marketplace listings</li>
          <li>Check real-time crop prices</li>
          <li>Get weather forecasts</li>
          <li>Receive expert agricultural advice</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://your-domain.com" style="background: #22C55E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The AgriConnect Team</p>
      </div>
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} AgriConnect. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Welcome to AgriConnect! Your account has been created successfully.`,
  });
};

/**
 * Send inquiry notification
 */
const sendInquiryNotification = async (seller, inquiry) => {
  const subject = 'New Inquiry on Your Listing 📬';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">New Inquiry Received!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hello <strong>${seller.name}</strong>,</p>
        <p>You have received a new inquiry on your listing:</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Listing:</strong> ${inquiry.crop_name}</p>
          <p><strong>From:</strong> ${inquiry.buyer_name}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${inquiry.message}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://your-domain.com/inquiries" style="background: #22C55E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Inquiry
          </a>
        </div>
        <p>Best regards,<br>The AgriConnect Team</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: seller.email,
    subject,
    html,
    text: `You have a new inquiry on your listing: ${inquiry.crop_name}`,
  });
};

/**
 * Send price alert
 */
const sendPriceAlert = async (user, priceData) => {
  const subject = `Price Alert: ${priceData.crop_name} 📊`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Price Alert!</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Price update for ${priceData.crop_name}:</p>
        <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0; color: #22C55E;">${priceData.price} ETB</h2>
          <p style="margin: 5px 0; color: #666;">per quintal</p>
          <p style="margin: 10px 0; color: ${priceData.change >= 0 ? '#22C55E' : '#EF4444'}; font-size: 18px;">
            ${priceData.change >= 0 ? '▲' : '▼'} ${Math.abs(priceData.change)}%
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://your-domain.com/prices" style="background: #22C55E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View All Prices
          </a>
        </div>
        <p>Best regards,<br>The AgriConnect Team</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Price update for ${priceData.crop_name}: ${priceData.price} ETB/quintal (${priceData.change >= 0 ? '+' : ''}${priceData.change}%)`,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `https://your-domain.com/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request 🔑';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested to reset your password. Click the button below to continue:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #22C55E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The AgriConnect Team</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html,
    text: `Reset your password: ${resetUrl}`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendInquiryNotification,
  sendPriceAlert,
  sendPasswordResetEmail,
};
EMAIL_EOF
echo -e "${GREEN}✅ Email service created${NC}"

# Create email templates directory
mkdir -p "$PROJECT_DIR/backend/src/templates/email"

# Test email
echo ""
echo -e "${YELLOW}📧 Testing email service...${NC}"
read -p "Enter test recipient email: " TEST_EMAIL

cat > "$PROJECT_DIR/backend/test-email.js" << TEST_EOF
const { sendEmail } = require('./src/services/email');

const testEmail = async () => {
  try {
    await sendEmail({
      to: '$TEST_EMAIL',
      subject: 'AgriConnect Email Service Test',
      text: 'This is a test email from AgriConnect.',
      html: '<h1>Test Email</h1><p>If you receive this, email service is working correctly!</p>',
    });
    console.log('✅ Test email sent successfully');
  } catch (error) {
    console.error('❌ Test email failed:', error);
  }
  process.exit();
};

testEmail();
TEST_EOF

cd "$PROJECT_DIR/backend"
node test-email.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test email sent${NC}"
else
    echo -e "${RED}❌ Test email failed${NC}"
fi

# Cleanup test file
rm -f "$PROJECT_DIR/backend/test-email.js"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Email Service Setup Completed!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📧 Provider: $PROVIDER"
echo "📝 Service: $PROJECT_DIR/backend/src/services/email.js"
echo "📬 From: $FROM_NAME <$FROM_EMAIL>"
echo ""
echo -e "${YELLOW}⚠️  Available Email Functions:${NC}"
echo "  - sendWelcomeEmail(user)"
echo "  - sendInquiryNotification(seller, inquiry)"
echo "  - sendPriceAlert(user, priceData)"
echo "  - sendPasswordResetEmail(user, resetToken)"
echo "  - sendEmail({ to, subject, text, html })"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Integrate email functions in your routes"
echo "2. Test with real users"
echo "3. Monitor email delivery rates"
echo "4. Configure email templates as needed"
echo ""
