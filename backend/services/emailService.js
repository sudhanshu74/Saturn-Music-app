/**
 * EMAIL SERVICE
 * Powered by Brevo REST API (Bypasses Render's firewall)
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
        // The sender email MUST match the one verified in your Brevo account
        sender: { name: 'Saturn Music', email: process.env.EMAIL_USER }, 
        to: [{ email: toEmail }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API Error: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Email Service Error:", error.message);
    throw error; 
  }
};

module.exports = { sendEmail };