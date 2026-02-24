import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    return response
  } catch (err) {
    console.error("EMAIL ERROR:", err)
    throw new Error("Email delivery failed")
  }
}
