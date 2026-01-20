import nodemailer from "nodemailer";

export const sendOtpEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const dateStr = new Date().toDateString();

  await transporter.sendMail({
    from: `Cab Connect <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Cab Connect OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding: 30px;">
        <div style="max-width: 520px; margin: auto; background:#ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);">
          
          <h2 style="margin: 0; color:#111827;">OTP Verification</h2>
          <p style="margin: 12px 0; color:#374151; font-size: 15px; line-height: 1.6;">
            Hi,<br/>
            Use the OTP below to complete your login to <b>Cab Connect</b>.
          </p>

          <div style="text-align:center; margin: 22px 0;">
            <div style="display:inline-block; background:#111827; color:#ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 14px 22px; border-radius: 10px;">
              ${otp}
            </div>
          </div>

          <p style="margin: 0; color:#6b7280; font-size: 14px;">
            This OTP will expire in <b>5 minutes</b>.
          </p>

          <hr style="border:none; border-top:1px solid #e5e7eb; margin: 22px 0;" />

          <p style="margin: 0; color:#6b7280; font-size: 13px; line-height: 1.5;">
            If you didn’t request this OTP, you can safely ignore this email.
          </p>

          <p style="margin-top: 18px; color:#111827; font-size: 13px; line-height: 1.6;">
            ${dateStr}<br/>
            From Starman<br/><br/>
            You can always Go around!
          </p>

        </div>
      </div>
    `,
  });
};
