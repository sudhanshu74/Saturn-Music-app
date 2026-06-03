// backend/services/emailService.js

/**
 * EMAIL SERVICE
 * Currently using: Brevo API (Best for free-tier global sending)
 * * Future Upgrade Path:
 * When you want to switch to Resend, AWS SES, or SendGrid, DO NOT touch auth.js!
 * Just replace the code inside this function with the new provider's logic.
 */

const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Saturn Music', email: process.env.EMAIL_USER }, 
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Email API Error: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Email Service Error:", error.message);
    throw error; // We throw the error so auth.js knows it failed and can alert the user
  }
};

module.exports = { sendEmail };