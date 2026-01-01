import { transporter } from "./mailer.js";

export const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: "cabconnectmit@gmail.com",
    to: email,
    subject: "Your Login OTP",
    html: `
      <h2>OTP Verification</h2>
      <h1>${otp}</h1>
      <p>Valid for 5 minutes</p>
    `,
  });
};
