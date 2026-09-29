import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

console.log('Email config:', {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '✅ exists' : '❌ missing'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"EaseMyFind" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to} ✅`);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
};