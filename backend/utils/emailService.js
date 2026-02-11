const nodemailer = require('nodemailer');

// Create reusable transporter
// Only create transporter if credentials are provided
let transporter = null;

const emailUser = (process.env.EMAIL_USER || 'jayalaxmishetty0612@gmail.com').toLowerCase();
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';

// Check if using Gmail SMTP with non-Gmail address
if (emailHost.includes('gmail.com') && !emailUser.includes('@gmail.com')) {
  console.log('⚠️  Configuration Warning:');
  console.log(`   EMAIL_HOST is set to Gmail (${emailHost})`);
  console.log(`   but EMAIL_USER is not a Gmail address (${emailUser})`);
  console.log('💡 SOLUTION:');
  console.log('   Option 1: Use a Gmail address for EMAIL_USER');
  console.log('   Option 2: Change EMAIL_HOST to match your email provider');
  console.log('   Example: EMAIL_HOST=smtp.jparksky.com (if using jparksky.com)');
}

transporter = nodemailer.createTransport({
  host: emailHost,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'jayalaxmishetty0612@gmail.com',
    pass: process.env.EMAIL_PASS || 'hurr gufd dtet xgqk', // App password for Gmail
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email service error:', error.message);
    console.log('💡 Make sure EMAIL_USER and EMAIL_PASS are set correctly in .env');
    console.log('💡 For Gmail, use an App Password (not your regular password)');
    console.log('💡 See EMAIL_SETUP.md for detailed instructions');
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

// Send verification code email
exports.sendVerificationCode = async (email, code) => {
  if (!transporter) {
    throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
  }

  try {
    const mailOptions = {
      from: `"Book Bridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Verification Code - Book Bridge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">📚 Book Bridge</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 16px;">
              You requested to reset your password. Use the verification code below to proceed:
            </p>
            <div style="background: white; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px;">
                ${code}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              <strong>Book Bridge Team</strong>
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `,
      text: `
        Book Bridge - Password Reset
        
        You requested to reset your password. Use the verification code below:
        
        ${code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification code sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Provide specific error messages for common issues
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\n🔐 AUTHENTICATION ERROR:');
      console.error('   The email credentials are incorrect.');
      console.error('\n💡 SOLUTION:');
      console.error('   1. Make sure you\'re using a Gmail App Password (NOT your regular password)');
      console.error('   2. Generate App Password: https://myaccount.google.com/apppasswords');
      console.error('   3. Enable 2-Factor Authentication first if not already enabled');
      console.error('   4. Copy the 16-character password (remove spaces)');
      console.error('   5. Update EMAIL_PASS in backend/.env');
      console.error('   6. Restart the server');
      throw new Error('Email authentication failed. Please use a Gmail App Password. See console for details.');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n🌐 CONNECTION ERROR:');
      console.error('   Could not connect to email server.');
      console.error('\n💡 SOLUTION:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify EMAIL_HOST and EMAIL_PORT in .env');
      console.error('   3. Some networks block SMTP - try a different network');
      throw new Error('Could not connect to email server. Check your connection and settings.');
    } else {
      throw new Error(`Failed to send verification code: ${error.message}`);
    }
  }
};

// Send order confirmation email
exports.sendOrderConfirmation = async (buyerEmail, buyerName, orders, totalAmount, paymentMethod) => {
  if (!transporter) {
    console.log('⚠️  Email service not configured. Order confirmation email not sent.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    // Format order details
    const orderItems = orders.map((order, index) => {
      const book = order.book;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${book?.title || 'N/A'}</strong><br>
            <span style="color: #6b7280; font-size: 14px;">by ${book?.author || 'N/A'}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${order.totalAmount}</td>
        </tr>
      `;
    }).join('');

    const mailOptions = {
      from: `"Book Bridge" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `Order Confirmation - Book Bridge`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">📚 Book Bridge</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937; margin-top: 0;">Order Confirmation</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Hi ${buyerName},
            </p>
            <p style="color: #4b5563; font-size: 16px;">
              Thank you for your purchase! Your order has been confirmed and we're preparing it for delivery.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 30px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 20px;">Order Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">#</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Book</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItems}
                  <tr>
                    <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb;">Total:</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #0ea5e9; border-top: 2px solid #e5e7eb;">₹${totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Payment Information</h3>
              <p style="color: #4b5563; margin: 5px 0;">
                <strong>Payment Method:</strong> ${paymentMethod === 'online' ? 'Online Payment (Razorpay)' : 'Cash on Delivery (COD)'}
              </p>
              <p style="color: #4b5563; margin: 5px 0;">
                <strong>Payment Status:</strong> ${paymentMethod === 'online' ? 'Paid' : 'Pending'}
              </p>
              ${paymentMethod === 'cod' ? `
                <p style="color: #0284c7; margin-top: 15px; padding: 12px; background: #e0f2fe; border-radius: 6px;">
                  <strong>💡 Cash on Delivery:</strong> Please keep the exact amount ready when the delivery arrives.
                </p>
              ` : ''}
            </div>

            ${orders[0]?.deliveryAddress ? `
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Delivery Address</h3>
                <p style="color: #4b5563; margin: 5px 0;">${orders[0].deliveryAddress.fullName}</p>
                <p style="color: #4b5563; margin: 5px 0;">${orders[0].deliveryAddress.addressLine1}</p>
                ${orders[0].deliveryAddress.addressLine2 ? `<p style="color: #4b5563; margin: 5px 0;">${orders[0].deliveryAddress.addressLine2}</p>` : ''}
                <p style="color: #4b5563; margin: 5px 0;">${orders[0].deliveryAddress.city}, ${orders[0].deliveryAddress.state} - ${orders[0].deliveryAddress.pincode}</p>
                ${orders[0].deliveryAddress.landmark ? `<p style="color: #4b5563; margin: 5px 0;">Landmark: ${orders[0].deliveryAddress.landmark}</p>` : ''}
                <p style="color: #4b5563; margin: 5px 0;">Phone: ${orders[0].deliveryAddress.phone}</p>
              </div>
            ` : ''}

            <div style="background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #0284c7; margin: 0; font-size: 14px;">
                <strong>📦 What's Next?</strong><br>
                Your order will be processed and shipped soon. You'll receive another email with tracking information once your order is shipped.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you have any questions, please contact our support team.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Best regards,<br>
              <strong>Book Bridge Team</strong>
            </p>
          </div>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">This is an automated email. Please do not reply.</p>
            <p style="margin: 5px 0;">Order ID: ${orders[0]?._id || 'N/A'}</p>
          </div>
        </div>
      `,
      text: `
        Book Bridge - Order Confirmation
        
        Hi ${buyerName},
        
        Thank you for your purchase! Your order has been confirmed.
        
        Order Details:
        ${orders.map((order, index) => `${index + 1}. ${order.book?.title || 'N/A'} by ${order.book?.author || 'N/A'} - ₹${order.totalAmount}`).join('\n')}
        
        Total: ₹${totalAmount}
        Payment Method: ${paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
        Payment Status: ${paymentMethod === 'online' ? 'Paid' : 'Pending'}
        
        ${paymentMethod === 'cod' ? 'Please keep the exact amount ready when the delivery arrives.' : ''}
        
        Your order will be processed and shipped soon.
        
        Best regards,
        Book Bridge Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    // Don't throw error - order is already created, email failure shouldn't break the flow
    return { success: false, message: error.message };
  }
};

module.exports = exports;
