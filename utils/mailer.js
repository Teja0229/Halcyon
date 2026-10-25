const nodemailer = require("nodemailer");

/**
 * Creates and returns a nodemailer transporter based on environment configuration.
 * Supports:
 * - Direct Gmail service with EMAIL_USER & EMAIL_PASS (or GMAIL_USER & GMAIL_PASS / GMAIL_APP_PASSWORD)
 * - Custom SMTP server with EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
 * - Automatic Ethereal email fallback / dev console logger if credentials are not configured
 */
async function getTransporter() {
    const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (user && pass) {
        if (process.env.EMAIL_HOST) {
            return {
                transporter: nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: Number(process.env.EMAIL_PORT) || 587,
                    secure: process.env.EMAIL_SECURE === "true" || Number(process.env.EMAIL_PORT) === 465,
                    auth: { user, pass }
                }),
                isDev: false,
                from: process.env.EMAIL_FROM || `"Halycon" <${user}>`
            };
        }

        return {
            transporter: nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || "gmail",
                auth: { user, pass }
            }),
            isDev: false,
            from: process.env.EMAIL_FROM || `"Halycon" <${user}>`
        };
    }

    // Development fallback using Ethereal test account or simulated console logging
    try {
        const testAccount = await nodemailer.createTestAccount();
        const devTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        return {
            transporter: devTransporter,
            isDev: true,
            from: '"Halycon Support (Dev Mode)" <no-reply@halycon.local>'
        };
    } catch (err) {
        console.warn("Could not create Ethereal test account, using simulated console output:", err.message);
        return {
            transporter: null,
            isDev: true,
            from: '"Halycon Support (Dev Mode)" <no-reply@halycon.local>'
        };
    }
}

/**
 * Send a password reset email with secure token link
 */
async function sendPasswordResetEmail({ toEmail, username, resetUrl }) {
    const { transporter, isDev, from } = await getTransporter();

    const subject = "Reset Your Password - Halycon";
    const text = `Hello ${username},\n\nWe received a request to reset your password for your Halycon account.\nPlease visit the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not make this request, you can safely ignore this email.\n\n- The Halycon Team`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Halycon</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #222222;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f9fc; padding: 40px 15px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e9ecef;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #f1f3f5; background: linear-gradient(180deg, #fff9f9 0%, #ffffff 100%);">
                                <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background-color: rgba(254, 66, 77, 0.12); border-radius: 50%; margin-bottom: 14px;">
                                    <span style="font-size: 30px; line-height: 1; color: #fe424d;">🧭</span>
                                </div>
                                <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #fe424d; letter-spacing: -0.5px;">Halycon</h1>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #717171; font-weight: 500;">Vacation Rentals, Homes & Stays</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 36px 40px;">
                                <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #222222;">Reset Your Password</h2>
                                <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #484848;">
                                    Hello <strong>${username}</strong>,
                                </p>
                                <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #484848;">
                                    We received a request to reset the password for your <strong>Halycon</strong> account. Click the button below to choose a new, secure password:
                                </p>
                                <!-- CTA Button -->
                                <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px;">
                                    <tr>
                                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #fe424d 0%, #e02834 100%); box-shadow: 0 4px 12px rgba(254, 66, 77, 0.3);">
                                            <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 34px; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <!-- Fallback link box -->
                                <div style="background-color: #f8f9fa; border: 1px solid #ebebeb; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                                    <p style="margin: 0 0 8px; font-size: 12px; color: #717171; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                        Having trouble with the button?
                                    </p>
                                    <p style="margin: 0 0 8px; font-size: 13px; color: #555555;">
                                        Copy and paste the following link into your web browser:
                                    </p>
                                    <p style="margin: 0; font-size: 13px; word-break: break-all;">
                                        <a href="${resetUrl}" style="color: #fe424d; text-decoration: none; font-weight: 500;">${resetUrl}</a>
                                    </p>
                                </div>
                                <div style="border-left: 3px solid #fe424d; padding-left: 14px; margin-bottom: 24px;">
                                    <p style="margin: 0 0 6px; font-size: 13px; line-height: 1.5; color: #555555;">
                                        ⏱️ <strong>Link expiration:</strong> This link will expire in <strong>1 hour</strong>.
                                    </p>
                                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #555555;">
                                        🛡️ <strong>Security note:</strong> If you did not request a password reset, you can safely ignore this email. Your account remains completely safe.
                                    </p>
                                </div>
                                <p style="margin: 0; font-size: 14px; color: #717171;">
                                    Warm regards,<br>
                                    <strong style="color: #222222;">The Halycon Team</strong>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #fafbfc; border-top: 1px solid #f1f3f5; text-align: center;">
                                <p style="margin: 0 0 4px; font-size: 12px; color: #888888;">
                                    This email was sent to <a href="mailto:${toEmail}" style="color: #717171; text-decoration: none;">${toEmail}</a>
                                </p>
                                <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                                    © ${new Date().getFullYear()} Halycon Inc. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    let info = null;
    let previewUrl = null;

    if (transporter) {
        info = await transporter.sendMail({
            from,
            to: toEmail,
            subject,
            text,
            html
        });
        if (isDev && nodemailer.getTestMessageUrl) {
            previewUrl = nodemailer.getTestMessageUrl(info);
        }
    }

    // Always log in terminal for quick debugging and testing
    console.log("\n=======================================================");
    console.log(`✉️  [HALYCON] Password Reset Email ${isDev ? "(DEV MODE)" : "(SENT)"}`);
    console.log(`To:         ${toEmail} (${username})`);
    console.log(`Reset Link: ${resetUrl}`);
    if (previewUrl) {
        console.log(`Preview:    ${previewUrl}`);
    }
    if (isDev) {
        console.log(`Notice:     To send real emails to real inboxes, add EMAIL_USER and EMAIL_PASS to your .env file.`);
    }
    console.log("=======================================================\n");

    return {
        success: true,
        devMode: isDev,
        previewUrl,
        messageId: info ? info.messageId : null
    };
}

/**
 * Send a confirmation email once the password has been reset successfully
 */
async function sendPasswordResetConfirmationEmail({ toEmail, username }) {
    try {
        const { transporter, from } = await getTransporter();

        const subject = "Your Password Has Been Changed - Halycon";
        const text = `Hello ${username},\n\nThis is a confirmation that the password for your Halycon account has just been successfully updated.\nIf you did not make this change, please contact our support team immediately at support@halycon.com.\n\n- The Halycon Team`;

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed - Halycon</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #222222;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f9fc; padding: 40px 15px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e9ecef;">
                            <tr>
                                <td style="padding: 36px 40px 24px; text-align: center; border-bottom: 1px solid #f1f3f5; background: linear-gradient(180deg, #f3faf5 0%, #ffffff 100%);">
                                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background-color: rgba(40, 167, 69, 0.12); border-radius: 50%; margin-bottom: 14px;">
                                        <span style="font-size: 28px; line-height: 1; color: #28a745;">✓</span>
                                    </div>
                                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #fe424d; letter-spacing: -0.5px;">Halycon</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 36px 40px;">
                                    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #222222;">Password Changed Successfully</h2>
                                    <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #484848;">
                                        Hello <strong>${username}</strong>,
                                    </p>
                                    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #484848;">
                                        This is a confirmation that the password for your <strong>Halycon</strong> account has been updated successfully. You can now log in with your new password.
                                    </p>
                                    <div style="background-color: #fff8f8; border: 1px solid #fde2e2; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
                                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #b02a37;">
                                            ⚠️ <strong>Didn't make this change?</strong> If you did not reset your password, please contact us immediately at <a href="mailto:support@halycon.com" style="color: #fe424d; font-weight: 600;">support@halycon.com</a> to secure your account.
                                        </p>
                                    </div>
                                    <p style="margin: 0; font-size: 14px; color: #717171;">
                                        Warm regards,<br>
                                        <strong style="color: #222222;">The Halycon Team</strong>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px 40px; background-color: #fafbfc; border-top: 1px solid #f1f3f5; text-align: center;">
                                    <p style="margin: 0; font-size: 12px; color: #aaaaaa;">
                                        © ${new Date().getFullYear()} Halycon Inc. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        if (transporter) {
            await transporter.sendMail({
                from,
                to: toEmail,
                subject,
                text,
                html
            });
        }
    } catch (err) {
        console.error("Failed to send password reset confirmation email:", err.message);
    }
}

module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail
};
