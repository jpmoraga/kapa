import { resend } from "@/lib/resend";

type SendVerificationEmailParams = {
  email: string;
  verifyUrl: string;
};

export async function sendVerificationEmail({
  email,
  verifyUrl,
}: SendVerificationEmailParams) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verifica tu correo en Kapa21",
    html: `
      <p>Hola,</p>
      <p>Para activar tu cuenta en <strong>Kapa21</strong>, haz click en el siguiente enlace:</p>
      <p>
        <a href="${verifyUrl}" target="_blank">
          Verificar correo
        </a>
      </p>
      <p>Este enlace expira en 24 horas.</p>
      <p>Si no creaste esta cuenta, puedes ignorar este correo.</p>
    `,
  });
}