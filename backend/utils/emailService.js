const nodemailer = require('nodemailer');

/**
 * Email service for sending OTP and other notifications
 * Handles email configuration and sending functionality
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  initializeTransporter() {
    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email configuration not found. Email service will be disabled.');
        return;
      }

      // Create transporter based on service type
      const serviceType = process.env.EMAIL_SERVICE || 'gmail';
      
      if (serviceType === 'gmail') {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      } else {
        // For other email services, use SMTP configuration
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
      }

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Email service configuration failed:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Verify email transporter configuration
   * @returns {Promise<boolean>} - True if configuration is valid
   */
  async verifyConfiguration() {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Email transporter verification failed:', error.message);
      return false;
    }
  }

  /**
   * Send OTP email for email verification
   * @param {string} emailAddress - Recipient email address
   * @param {string} fullName - Recipient full name
   * @param {string} otpCode - OTP code to send
   * @returns {Promise<boolean>} - True if email sent successfully
   */
  async sendOtpEmail(emailAddress, fullName, otpCode) {
    if (!this.isConfigured) {
      console.warn('⚠️  Email service not configured. OTP email not sent.');
      return false;
    }

    try {
      const emailContent = this.generateOtpEmailContent(fullName, otpCode);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Notes App <noreply@notesapp.com>',
        to: emailAddress,
        subject: 'Verify Your Email Address - Notes App',
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully to:', emailAddress);
      return true;
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error.message);
      return false;
    }
  }

  /**
   * Send welcome email after successful registration
   * @param {string} emailAddress - Recipient email address
   * @param {string} fullName - Recipient full name
   * @returns {Promise<boolean>} - True if email sent successfully
   */
  async sendWelcomeEmail(emailAddress, fullName) {
    if (!this.isConfigured) {
      console.warn('⚠️  Email service not configured. Welcome email not sent.');
      return false;
    }

    try {
      const emailContent = this.generateWelcomeEmailContent(fullName);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Notes App <noreply@notesapp.com>',
        to: emailAddress,
        subject: 'Welcome to Notes App!',
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully to:', emailAddress);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      return false;
    }
  }

  /**
   * Generate HTML and text content for OTP email
   * @param {string} fullName - User's full name
   * @param {string} otpCode - OTP code
   * @returns {Object} - Object containing html and text content
   */
  generateOtpEmailContent(fullName, otpCode) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Notes App</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-code { background: #fff; border: 2px solid #4CAF50; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #4CAF50; margin: 20px 0; border-radius: 8px; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Notes App</h1>
            <p>Email Verification</p>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Thank you for signing up with Notes App. To complete your registration, please verify your email address using the OTP code below:</p>
            
            <div class="otp-code">${otpCode}</div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This OTP code will expire in 10 minutes</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this verification, please ignore this email</li>
              </ul>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Notes App Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Hello ${fullName}!
      
      Thank you for signing up with Notes App. To complete your registration, please verify your email address using the OTP code below:
      
      OTP Code: ${otpCode}
      
      Important:
      - This OTP code will expire in 10 minutes
      - Do not share this code with anyone
      - If you didn't request this verification, please ignore this email
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
      
      Best regards,
      The Notes App Team
      
      ---
      This is an automated message. Please do not reply to this email.
    `;

    return { html: htmlContent, text: textContent };
  }

  /**
   * Generate HTML and text content for welcome email
   * @param {string} fullName - User's full name
   * @returns {Object} - Object containing html and text content
   */
  generateWelcomeEmailContent(fullName) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Notes App</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .feature { background: #fff; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Notes App!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
            
            <h3>What you can do with Notes App:</h3>
            <div class="feature">
              <strong>📝 Create Notes:</strong> Write and organize your thoughts, ideas, and important information.
            </div>
            <div class="feature">
              <strong>🏷️ Tag System:</strong> Categorize your notes with custom tags for easy organization.
            </div>
            <div class="feature">
              <strong>🔍 Search:</strong> Quickly find any note using our powerful search functionality.
            </div>
            <div class="feature">
              <strong>📱 Cross-Platform:</strong> Access your notes from anywhere, on any device.
            </div>
            
            <p>You're all set to start creating and managing your notes! If you have any questions or need help getting started, feel free to reach out to our support team.</p>
            
            <p>Happy note-taking!<br>The Notes App Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to Notes App!
      
      Hello ${fullName}!
      
      Congratulations! Your email has been successfully verified and your account is now active.
      
      What you can do with Notes App:
      
      📝 Create Notes: Write and organize your thoughts, ideas, and important information.
      🏷️ Tag System: Categorize your notes with custom tags for easy organization.
      🔍 Search: Quickly find any note using our powerful search functionality.
      📱 Cross-Platform: Access your notes from anywhere, on any device.
      
      You're all set to start creating and managing your notes! If you have any questions or need help getting started, feel free to reach out to our support team.
      
      Happy note-taking!
      The Notes App Team
      
      ---
      This is an automated message. Please do not reply to this email.
    `;

    return { html: htmlContent, text: textContent };
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
