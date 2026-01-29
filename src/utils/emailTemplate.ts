import express from 'express'
const emailVerificationTemplate=(user:any,verificationLink:string)=>{
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Email Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0; background-color:#f4f6f8;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden;
          box-shadow:0 10px 30px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1e3a8a); padding:32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">
                Email Verification
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 16px; font-size:16px; color:#111827;">
                Hello <strong>${user.name}</strong>,
              </p>

              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#374151;">
                Thank you for registering. Please confirm your email address to activate your account.
                This helps us ensure the security of your account.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationLink}"
                       style="display:inline-block; padding:14px 36px;
                       background-color:#2563eb; color:#ffffff; text-decoration:none;
                       font-size:15px; font-weight:600; border-radius:8px;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px; font-size:14px; color:#6b7280;">
                If the button does not work, copy and paste the link below into your browser:
              </p>

              <p style="margin:0; font-size:13px; color:#2563eb; word-break:break-all;">
                ${verificationLink}
              </p>

              <p style="margin:28px 0 0; font-size:14px; color:#6b7280;">
                If you did not create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding:20px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © 2026 Abu Syeed Abdullah. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `
}




export const emailTemplate={
    emailVerificationTemplate
}