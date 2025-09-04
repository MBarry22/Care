const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your SeniorCare Connect Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to SeniorCare Connect</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for SeniorCare Connect! To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account with SeniorCare Connect, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
    
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your SeniorCare Connect Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #FF6B6B; color: white; padding: 20px; text-align: center;">
            <h1>Password Reset Request</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your SeniorCare Connect account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #FF6B6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
    
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to SeniorCare Connect!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to SeniorCare Connect!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name}!</h2>
            <p>Welcome to SeniorCare Connect! We're excited to help you and your family manage care coordination.</p>
            
            <h3>Getting Started</h3>
            <ul>
              <li>Download our mobile app from the App Store or Google Play</li>
              <li>Set up your profile and add family members</li>
              <li>Add medications and set up reminders</li>
              <li>Schedule appointments and track health data</li>
            </ul>
            
            <h3>Need Help?</h3>
            <p>Our support team is here to help you get started:</p>
            <ul>
              <li>Email: support@seniorcareconnect.ca</li>
              <li>Phone: 1-800-SENIOR-CARE</li>
              <li>Website: www.seniorcareconnect.ca</li>
            </ul>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Thank you for choosing SeniorCare Connect for your care coordination needs.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
    
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
