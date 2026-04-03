import { env } from "../config/env";
import transporter from "../config/nodeMailer";


const buildOtpHtml = (title: string, message: string, otpCode: string, ttlMinutes: number) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <h2 style="margin-bottom: 12px;">${title}</h2>
    <p style="margin: 0 0 12px;">${message}</p>
    <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">
      ${otpCode}
    </div>
    <p style="margin: 0 0 8px;">This code will expire in ${ttlMinutes} minutes.</p>
    <p style="margin: 0;">If you did not request this code, you can ignore this email.</p>
  </div>
`;

const sendOtpEmail = async (
  email: string,
  subject: string,
  message: string,
  otpCode: string,
  ttlMinutes: number
) => {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER must be configured to send OTP emails.");
  }

  await transporter.sendMail({
    from: env.SENDER_EMAIL,
    to: email,
    subject,
    text: `${message} Your OTP code is ${otpCode}. It will expire in ${ttlMinutes} minutes.`,
    html: buildOtpHtml(subject, message, otpCode, ttlMinutes)
  });
};

export const sendVerificationOtpEmail = async (
  email: string,
  otpCode: string,
  ttlMinutes: number
) =>
  sendOtpEmail(
    email,
    "Verify Your Email",
    "Use the code below to verify your account email address.",
    otpCode,
    ttlMinutes
  );

export const sendPasswordResetOtpEmail = async (
  email: string,
  otpCode: string,
  ttlMinutes: number
) =>
  sendOtpEmail(
    email,
    "Reset Your Password",
    "Use the code below to reset your account password.",
    otpCode,
    ttlMinutes
  );
