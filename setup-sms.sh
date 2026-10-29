#!/bin/bash
# AgriConnect SMS Service Setup Script
# Configures SMS notifications using Twilio or Africa's Talking

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📱 AgriConnect SMS Service Setup${NC}"
echo "=================================="

# Configuration
PROJECT_DIR="/var/www/agriconnect"
ENV_FILE="$PROJECT_DIR/backend/.env.production"

echo ""
echo "Choose SMS provider:"
echo "1) Twilio (Global - Reliable)"
echo "2) Africa's Talking (Recommended for Ethiopia)"
echo "3) AWS SNS (High volume)"
echo ""
read -p "Enter choice (1-3): " PROVIDER_CHOICE

case $PROVIDER_CHOICE in
    1)
        PROVIDER="twilio"
        echo ""
        echo -e "${YELLOW}📝 Twilio Setup Instructions:${NC}"
        echo "1. Create account at https://www.twilio.com"
        echo "2. Get Account SID from dashboard"
        echo "3. Get Auth Token from dashboard"
        echo "4. Buy a phone number"
        echo ""
        read -p "Enter Twilio Account SID: " ACCOUNT_SID
        read -p "Enter Twilio Auth Token: " AUTH_TOKEN
        read -p "Enter Twilio Phone Number (with +): " FROM_NUMBER
        ;;
    2)
        PROVIDER="africastalking"
        echo ""
        echo -e "${YELLOW}📝 Africa's Talking Setup Instructions:${NC}"
        echo "1. Create account at https://africastalking.com"
        echo "2. Get API Key from dashboard"
        echo "3. Get Username from dashboard"
        echo "4. Buy shortcode or use sandbox"
        echo ""
        read -p "Enter Africa's Talking Username: " AT_USERNAME
        read -p "Enter Africa's Talking API Key: " AT_API_KEY
        read -p "Enter Sender ID/Shortcode: " FROM_NUMBER
        ;;
    3)
        PROVIDER="sns"
        echo ""
        echo -e "${YELLOW}📝 AWS SNS Setup Instructions:${NC}"
        echo "1. Configure AWS credentials"
        echo "2. Enable SNS in your region"
        echo "3. Request production access"
        echo ""
        read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY
        read -p "Enter AWS Secret Access Key: " AWS_SECRET_KEY
        read -p "Enter AWS Region: " AWS_REGION
        FROM_NUMBER="AWS SNS"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Install SMS packages
echo -e "${YELLOW}📦 Installing SMS packages...${NC}"
cd "$PROJECT_DIR/backend"

if [ "$PROVIDER" = "twilio" ]; then
    npm install twilio --save
elif [ "$PROVIDER" = "africastalking" ]; then
    npm install africastalking --save
elif [ "$PROVIDER" = "sns" ]; then
    npm install @aws-sdk/client-sns --save
fi

echo -e "${GREEN}✅ SMS packages installed${NC}"

# Update environment variables
echo -e "${YELLOW}⚙️  Updating environment variables...${NC}"
sed -i "s/SMS_ENABLED=.*/SMS_ENABLED=true/" "$ENV_FILE"
sed -i "s/SMS_PROVIDER=.*/SMS_PROVIDER=$PROVIDER/" "$ENV_FILE"

if [ "$PROVIDER" = "twilio" ]; then
    sed -i "s/SMS_ACCOUNT_SID=.*/SMS_ACCOUNT_SID=$ACCOUNT_SID/" "$ENV_FILE"
    sed -i "s|SMS_AUTH_TOKEN=.*|SMS_AUTH_TOKEN=$AUTH_TOKEN|" "$ENV_FILE"
    sed -i "s|SMS_FROM_NUMBER=.*|SMS_FROM_NUMBER=$FROM_NUMBER|" "$ENV_FILE"
elif [ "$PROVIDER" = "africastalking" ]; then
    echo "AT_USERNAME=$AT_USERNAME" >> "$ENV_FILE"
    echo "AT_API_KEY=$AT_API_KEY" >> "$ENV_FILE"
    sed -i "s|SMS_FROM_NUMBER=.*|SMS_FROM_NUMBER=$FROM_NUMBER|" "$ENV_FILE"
elif [ "$PROVIDER" = "sns" ]; then
    sed -i "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY/" "$ENV_FILE"
    sed -i "s|AWS_SECRET_ACCESS_KEY=.*|AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY|" "$ENV_FILE"
    sed -i "s/AWS_REGION=.*/AWS_REGION=$AWS_REGION/" "$ENV_FILE"
fi

echo -e "${GREEN}✅ Environment updated${NC}"

# Create SMS service
echo -e "${YELLOW}📝 Creating SMS service...${NC}"
cat > "$PROJECT_DIR/backend/src/services/sms.js" << 'SMS_EOF'
/**
 * SMS Service
 * Handles sending SMS using multiple providers
 */

let smsClient;

// Initialize SMS client based on provider
const initSMSClient = () => {
  const provider = process.env.SMS_PROVIDER;

  if (provider === 'twilio') {
    const twilio = require('twilio');
    smsClient = twilio(
      process.env.SMS_ACCOUNT_SID,
      process.env.SMS_AUTH_TOKEN
    );
  } else if (provider === 'africastalking') {
    const AfricasTalking = require('africastalking');
    const at = AfricasTalking({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
    });
    smsClient = at.SMS;
  } else if (provider === 'sns') {
    const { SNSClient } = require('@aws-sdk/client-sns');
    smsClient = new SNSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  if (smsClient) {
    console.log(`✅ SMS service initialized (${provider})`);
  }
};

/**
 * Send SMS
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - SMS content
 */
const sendSMS = async (to, message) => {
  if (process.env.SMS_ENABLED !== 'true') {
    console.log('📱 SMS disabled - Would send:', { to, message });
    return { success: true, disabled: true };
  }

  if (!smsClient) {
    initSMSClient();
  }

  const provider = process.env.SMS_PROVIDER;

  try {
    let result;

    if (provider === 'twilio') {
      result = await smsClient.messages.create({
        body: message,
        from: process.env.SMS_FROM_NUMBER,
        to,
      });
      console.log('✅ SMS sent (Twilio):', result.sid);
      return { success: true, messageId: result.sid, provider: 'twilio' };

    } else if (provider === 'africastalking') {
      result = await smsClient.send({
        to: [to],
        message,
        from: process.env.SMS_FROM_NUMBER,
      });
      console.log('✅ SMS sent (Africa\'s Talking):', result);
      return { success: true, result, provider: 'africastalking' };

    } else if (provider === 'sns') {
      const { PublishCommand } = require('@aws-sdk/client-sns');
      const command = new PublishCommand({
        Message: message,
        PhoneNumber: to,
      });
      result = await smsClient.send(command);
      console.log('✅ SMS sent (AWS SNS):', result.MessageId);
      return { success: true, messageId: result.MessageId, provider: 'sns' };
    }

    throw new Error('Unknown SMS provider');
  } catch (error) {
    console.error('❌ SMS error:', error);
    throw error;
  }
};

/**
 * Send OTP via SMS
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - One-time password
 */
const sendOTP = async (phoneNumber, otp) => {
  const message = `Your AgriConnect verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  return sendSMS(phoneNumber, message);
};

/**
 * Send welcome SMS
 * @param {Object} user - User object
 */
const sendWelcomeSMS = async (user) => {
  const message = `Welcome to AgriConnect, ${user.name}! 🌾 Start exploring marketplace, prices, and weather. Download app: https://your-domain.com`;
  return sendSMS(user.phone_number, message);
};

/**
 * Send inquiry notification SMS
 * @param {Object} seller - Seller object
 * @param {Object} inquiry - Inquiry object
 */
const sendInquirySMS = async (seller, inquiry) => {
  const message = `New inquiry on your ${inquiry.crop_name} listing from ${inquiry.buyer_name}. Login to view: https://your-domain.com/inquiries`;
  return sendSMS(seller.phone_number, message);
};

/**
 * Send price alert SMS
 * @param {Object} user - User object
 * @param {Object} priceData - Price data
 */
const sendPriceAlertSMS = async (user, priceData) => {
  const change = priceData.change >= 0 ? `+${priceData.change}` : priceData.change;
  const message = `Price Alert: ${priceData.crop_name} is now ${priceData.price} ETB/quintal (${change}%). View details: https://your-domain.com/prices`;
  return sendSMS(user.phone_number, message);
};

/**
 * Send listing approved SMS
 * @param {Object} user - User object
 * @param {Object} listing - Listing object
 */
const sendListingApprovedSMS = async (user, listing) => {
  const message = `Your listing for ${listing.crop_name} has been approved and is now live on AgriConnect! View: https://your-domain.com/listings/${listing.id}`;
  return sendSMS(user.phone_number, message);
};

/**
 * Send password reset SMS
 * @param {Object} user - User object
 * @param {string} resetCode - Reset code
 */
const sendPasswordResetSMS = async (user, resetCode) => {
  const message = `Your AgriConnect password reset code is: ${resetCode}. Valid for 15 minutes. If you didn't request this, ignore this message.`;
  return sendSMS(user.phone_number, message);
};

module.exports = {
  sendSMS,
  sendOTP,
  sendWelcomeSMS,
  sendInquirySMS,
  sendPriceAlertSMS,
  sendListingApprovedSMS,
  sendPasswordResetSMS,
};
SMS_EOF
echo -e "${GREEN}✅ SMS service created${NC}"

# Test SMS
echo ""
echo -e "${YELLOW}📱 Testing SMS service...${NC}"
read -p "Enter test phone number (with country code, e.g., +251911234567): " TEST_PHONE

cat > "$PROJECT_DIR/backend/test-sms.js" << TEST_EOF
const { sendSMS } = require('./src/services/sms');

const testSMS = async () => {
  try {
    await sendSMS(
      '$TEST_PHONE',
      'Test message from AgriConnect SMS service. If you receive this, SMS is working!'
    );
    console.log('✅ Test SMS sent successfully');
  } catch (error) {
    console.error('❌ Test SMS failed:', error);
  }
  process.exit();
};

testSMS();
TEST_EOF

cd "$PROJECT_DIR/backend"
node test-sms.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test SMS sent${NC}"
else
    echo -e "${RED}❌ Test SMS failed${NC}"
fi

# Cleanup test file
rm -f "$PROJECT_DIR/backend/test-sms.js"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ SMS Service Setup Completed!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📱 Provider: $PROVIDER"
echo "📝 Service: $PROJECT_DIR/backend/src/services/sms.js"
echo "📞 From: $FROM_NUMBER"
echo ""
echo -e "${YELLOW}⚠️  Available SMS Functions:${NC}"
echo "  - sendOTP(phoneNumber, otp)"
echo "  - sendWelcomeSMS(user)"
echo "  - sendInquirySMS(seller, inquiry)"
echo "  - sendPriceAlertSMS(user, priceData)"
echo "  - sendListingApprovedSMS(user, listing)"
echo "  - sendPasswordResetSMS(user, resetCode)"
echo "  - sendSMS(to, message)"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Integrate SMS functions in your auth and notification routes"
echo "2. Test with real users"
echo "3. Monitor SMS delivery rates"
echo "4. Consider SMS rate limits and costs"
echo ""
