const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error("Failed to create access token:", err);
        reject("Failed to create access token");
      }
      resolve(token);
    });
  });

// 4. Create and return the Nodemailer transporter
  return nodemailer.createTransport({
    // Force IPv4 to prevent Render ENETUNREACH errors
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    family: 4, // <-- This is the magic line that fixes the crash!
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      accessToken,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  });
};

const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const emailTransporter = await createTransporter();
    
    const mailOptions = {
      from: `Saturn Music <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", info.messageId);
    return info;
  } catch (error) {
    console.error("OAuth2 Email Service Error:", error);
    throw error;
  }
};

module.exports = { sendEmail };