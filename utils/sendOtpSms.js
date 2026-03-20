import nodemailer from "nodemailer";

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export const sendOtpSms = async ({ email, otp }) => {
  const transporter = createTransporter();

  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`OTP for ${email}: ${otp}`);
      return { simulated: true };
    }

    throw new Error("Email provider is not configured");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "SGPC Password Reset OTP",
    text: `Your SGPC password reset OTP is ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your SGPC password reset OTP is <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`,
  });

  return { simulated: false };
};
