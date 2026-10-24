# Shivam Optical — Supabase Email Templates Suite

This document contains the production-ready HTML email templates for all 6 Supabase Authentication events. Each template is engineered with:
- **Dual-Verification Support**: Both the 6-digit OTP code (`{{ .Token }}`) and the 1-click confirmation link (`{{ .ConfirmationURL }}`) are provided.
- **Luxury Visual Identity**: Dark atelier green (`#0A251C`), champagne gold accents (`#C5A059`), and soft cream canvas (`#FAF7F2`).
- **Responsive & Email-Client Safe**: Compatible with Gmail, Apple Mail, Outlook, mobile devices, and dark mode.
- **Strict Zero Emojis**: Complies with the atelier standard using clean typographic layout and hairline borders.

---

## 1. Confirm Sign Up
**Supabase Dashboard Location**: `Authentication` -> `Email Templates` -> **Confirm sign up**  
**Subject Line**: `Confirm your Shivam Optical registration`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Registration</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A1E17; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E8DEC8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,37,28,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A251C; padding: 32px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #C5A059; margin-bottom: 6px;">
                CLINICAL EYEWEAR &amp; ZEISS VISION CARE
              </div>
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF;">
                SHIVAM OPTICAL
              </div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #A3B8B0; margin-top: 4px;">
                MAYUR VIHAR ATELIER &bull; NEW DELHI
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C5A059; margin-bottom: 8px;">
                PATRON PRIVILEGE ACTIVATION
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0A251C; margin: 0 0 14px 0; line-height: 1.3;">
                Confirm Your Account Registration
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                Welcome to Shivam Optical. To activate your patron account and access your personal clinical prescription vault, please verify your email address.
              </p>

              <!-- Option A: 6-Digit Verification Code -->
              <table role="presentation" width="100%" style="background-color: #FAF7F2; border: 1px solid #E8DEC8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 22px 20px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #78716C; margin-bottom: 8px;">
                      6-DIGIT VERIFICATION CODE
                    </div>
                    <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #0A251C; padding: 4px 0 6px 0;">
                      {{ .Token }}
                    </div>
                    <div style="font-size: 11px; color: #78716C; margin-top: 6px;">
                      Enter this code in your browser window to verify immediately.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="border-bottom: 1px solid #E8DEC8; text-align: center; height: 1px;"></td>
                  <td style="width: 1px; white-space: nowrap; padding: 0 14px; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #A8A29E;">
                    OR 1-CLICK CONFIRMATION
                  </td>
                  <td style="border-bottom: 1px solid #E8DEC8; text-align: center; height: 1px;"></td>
                </tr>
              </table>

              <!-- Option B: 1-Click Confirmation Button -->
              <table role="presentation" width="100%" style="margin-top: 10px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0A251C; color: #C5A059; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 10px; border: 1px solid #0A251C;">
                      Confirm Email &amp; Activate Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Multi-Device Helper -->
              <div style="background-color: #F5EFEB; border-radius: 10px; padding: 12px 16px; font-size: 11px; line-height: 1.5; color: #57534E;">
                <strong style="color: #0A251C;">Multi-Device Sign In:</strong> If you are registering on a laptop while opening this email on your mobile phone, simply enter the 6-digit code above directly into your laptop browser.
              </div>

              <!-- Expiry Note -->
              <p style="font-size: 11px; color: #A8A29E; line-height: 1.5; margin: 20px 0 0 0;">
                This code and link will expire in 10 minutes. If you did not create an account with Shivam Optical, please disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC8; padding: 22px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #0A251C; margin-bottom: 4px;">
                Shivam Optical Atelier &bull; Clinical Vision Care
              </div>
              <div style="font-size: 10px; color: #78716C; line-height: 1.4;">
                Mayur Vihar Phase 1, Pocket 1, New Delhi 110091<br>
                Official Zeiss Vision Partner &bull; Designer Eyewear Boutique
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Magic Link or OTP (Primary Sign-In)
**Supabase Dashboard Location**: `Authentication` -> `Email Templates` -> **Magic link or OTP**  
**Subject Line**: `Your Shivam Optical verification code & sign-in link`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In to Shivam Optical</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A1E17; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E8DEC8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,37,28,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A251C; padding: 32px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #C5A059; margin-bottom: 6px;">
                PATRON AUTHENTICATION
              </div>
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF;">
                SHIVAM OPTICAL
              </div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #A3B8B0; margin-top: 4px;">
                MAYUR VIHAR ATELIER &bull; NEW DELHI
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C5A059; margin-bottom: 8px;">
                SECURE ACCESS VAULT
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0A251C; margin: 0 0 14px 0; line-height: 1.3;">
                Sign In to Your Patron Account
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                We received a sign-in request for your account. You can use the 6-digit code or the instant 1-click verification button below to access the atelier.
              </p>

              <!-- Option A: 6-Digit OTP Code -->
              <table role="presentation" width="100%" style="background-color: #FAF7F2; border: 1px solid #E8DEC8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 22px 20px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #78716C; margin-bottom: 8px;">
                      6-DIGIT VERIFICATION CODE
                    </div>
                    <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #0A251C; padding: 4px 0 6px 0;">
                      {{ .Token }}
                    </div>
                    <div style="font-size: 11px; color: #78716C; margin-top: 6px;">
                      Enter this code in your browser to sign in immediately.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="border-bottom: 1px solid #E8DEC8; text-align: center; height: 1px;"></td>
                  <td style="width: 1px; white-space: nowrap; padding: 0 14px; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #A8A29E;">
                    OR 1-CLICK INSTANT ACCESS
                  </td>
                  <td style="border-bottom: 1px solid #E8DEC8; text-align: center; height: 1px;"></td>
                </tr>
              </table>

              <!-- Option B: 1-Click Magic Link Button -->
              <table role="presentation" width="100%" style="margin-top: 10px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0A251C; color: #C5A059; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 10px; border: 1px solid #0A251C;">
                      Sign In to Shivam Optical
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Multi-Device Helper -->
              <div style="background-color: #F5EFEB; border-radius: 10px; padding: 12px 16px; font-size: 11px; line-height: 1.5; color: #57534E;">
                <strong style="color: #0A251C;">Device Tip:</strong> Logging in from your computer? Just enter the 6-digit code on your screen without opening this email on that device.
              </div>

              <!-- Security Notice -->
              <p style="font-size: 11px; color: #A8A29E; line-height: 1.5; margin: 20px 0 0 0;">
                This authentication code is valid for 10 minutes and can only be used once. Never share this code with anyone. If you did not request this login, your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC8; padding: 22px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #0A251C; margin-bottom: 4px;">
                Shivam Optical Atelier &bull; Clinical Vision Care
              </div>
              <div style="font-size: 10px; color: #78716C; line-height: 1.4;">
                Mayur Vihar Phase 1, Pocket 1, New Delhi 110091<br>
                Encrypted Patron Authentication &bull; Zero Spam Guarantee
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Reset Password
**Supabase Dashboard Location**: `Authentication` -> `Email Templates` -> **Reset password**  
**Subject Line**: `Reset your Shivam Optical password`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A1E17; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E8DEC8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,37,28,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A251C; padding: 32px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #C5A059; margin-bottom: 6px;">
                SECURITY &amp; RECOVERY
              </div>
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF;">
                SHIVAM OPTICAL
              </div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #A3B8B0; margin-top: 4px;">
                MAYUR VIHAR ATELIER &bull; NEW DELHI
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C5A059; margin-bottom: 8px;">
                CREDENTIAL ASSISTANCE
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0A251C; margin: 0 0 14px 0; line-height: 1.3;">
                Reset Your Account Password
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                We received a request to reset your Shivam Optical account password. You can enter the reset code or click the direct button below to create a new password.
              </p>

              <!-- Option A: 6-Digit Reset Code -->
              <table role="presentation" width="100%" style="background-color: #FAF7F2; border: 1px solid #E8DEC8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 22px 20px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #78716C; margin-bottom: 8px;">
                      PASSWORD RESET CODE
                    </div>
                    <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #0A251C; padding: 4px 0 6px 0;">
                      {{ .Token }}
                    </div>
                    <div style="font-size: 11px; color: #78716C; margin-top: 6px;">
                      Enter this code on the password reset screen.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="border-bottom: 1px solid #E8DEC8; text-align: center; height: 1px;"></td>
                  <td style="width: 1px; white-space: nowrap; padding: 0 14px; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #A8A29E;">
                    OR DIRECT RESET LINK
                  </td>
                  <td style="border-bottom: 1px solid #E8DEC8; text-align: center; height: 1px;"></td>
                </tr>
              </table>

              <!-- Option B: 1-Click Reset Button -->
              <table role="presentation" width="100%" style="margin-top: 10px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0A251C; color: #C5A059; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 10px; border: 1px solid #0A251C;">
                      Reset Account Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 11px; color: #A8A29E; line-height: 1.5; margin: 20px 0 0 0;">
                If you did not request a password reset, please ignore this email. Your current credentials will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC8; padding: 22px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #0A251C; margin-bottom: 4px;">
                Shivam Optical Atelier &bull; Mayur Vihar, New Delhi
              </div>
              <div style="font-size: 10px; color: #78716C; line-height: 1.4;">
                Automated Security Notification &bull; Do Not Reply
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Invite User
**Supabase Dashboard Location**: `Authentication` -> `Email Templates` -> **Invite user**  
**Subject Line**: `You're invited to join Shivam Optical Atelier`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patron Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A1E17; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E8DEC8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,37,28,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A251C; padding: 32px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #C5A059; margin-bottom: 6px;">
                EXCLUSIVE INVITATION
              </div>
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF;">
                SHIVAM OPTICAL
              </div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #A3B8B0; margin-top: 4px;">
                MAYUR VIHAR ATELIER &bull; NEW DELHI
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C5A059; margin-bottom: 8px;">
                PATRON PRIVILEGE
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0A251C; margin: 0 0 14px 0; line-height: 1.3;">
                You Have Been Invited to Join the Atelier
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                You have received an invitation to join Shivam Optical Atelier. As an invited patron, you gain access to our precision lens customization, designer frames catalog, and clinical optical assembly tracking.
              </p>

              <!-- Acceptance Button -->
              <table role="presentation" width="100%" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0A251C; color: #C5A059; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 10px; border: 1px solid #0A251C;">
                      Accept Invitation &amp; Join Atelier
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 11px; color: #A8A29E; line-height: 1.5; margin: 20px 0 0 0;">
                This invitation link is valid for 7 days. If you did not anticipate this invitation, you may ignore this notice.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC8; padding: 22px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #0A251C; margin-bottom: 4px;">
                Shivam Optical &bull; Mayur Vihar Phase 1, Pocket 1, Delhi 110091
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Change Email Address
**Supabase Dashboard Location**: `Authentication` -> `Email Templates` -> **Change email address**  
**Subject Line**: `Confirm your new email address for Shivam Optical`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A1E17; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E8DEC8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,37,28,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A251C; padding: 32px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #C5A059; margin-bottom: 6px;">
                ACCOUNT SECURITY
              </div>
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF;">
                SHIVAM OPTICAL
              </div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #A3B8B0; margin-top: 4px;">
                MAYUR VIHAR ATELIER &bull; NEW DELHI
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C5A059; margin-bottom: 8px;">
                EMAIL MODIFICATION
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0A251C; margin: 0 0 14px 0; line-height: 1.3;">
                Confirm Your New Email Address
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                We received a request to update your registered email address on Shivam Optical. To complete this change, please verify this email address.
              </p>

              <!-- Option A: 6-Digit Code -->
              <table role="presentation" width="100%" style="background-color: #FAF7F2; border: 1px solid #E8DEC8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 22px 20px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #78716C; margin-bottom: 8px;">
                      VERIFICATION CODE
                    </div>
                    <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #0A251C; padding: 4px 0 6px 0;">
                      {{ .Token }}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Option B: Direct Confirmation Button -->
              <table role="presentation" width="100%" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0A251C; color: #C5A059; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 10px; border: 1px solid #0A251C;">
                      Confirm New Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 11px; color: #A8A29E; line-height: 1.5; margin: 20px 0 0 0;">
                If you did not request this update, please contact support immediately or change your password.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC8; padding: 22px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #0A251C;">
                Shivam Optical &bull; Mayur Vihar Phase 1, Pocket 1, Delhi 110091
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Reauthentication
**Supabase Dashboard Location**: `Authentication` -> `Email Templates` -> **Reauthentication**  
**Subject Line**: `Shivam Optical security verification code`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Reauthentication</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2A1E17; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E8DEC8; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(10,37,28,0.04);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A251C; padding: 32px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.25em; text-transform: uppercase; color: #C5A059; margin-bottom: 6px;">
                SECURITY CHALLENGE
              </div>
              <div style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 0.05em; color: #FFFFFF;">
                SHIVAM OPTICAL
              </div>
              <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #A3B8B0; margin-top: 4px;">
                MAYUR VIHAR ATELIER &bull; NEW DELHI
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C5A059; margin-bottom: 8px;">
                IDENTITY RE-VERIFICATION
              </div>
              <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0A251C; margin: 0 0 14px 0; line-height: 1.3;">
                Authorize Sensitive Action
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
                A sensitive operation was initiated on your Shivam Optical account. Please enter the single-use authorization code below to confirm your identity.
              </p>

              <!-- 6-Digit Reauthentication Code -->
              <table role="presentation" width="100%" style="background-color: #FAF7F2; border: 1px solid #E8DEC8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 22px 20px; text-align: center;">
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #78716C; margin-bottom: 8px;">
                      SECURITY AUTHORIZATION CODE
                    </div>
                    <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 32px; font-weight: 800; letter-spacing: 0.35em; color: #0A251C; padding: 4px 0 6px 0;">
                      {{ .Token }}
                    </div>
                    <div style="font-size: 11px; color: #78716C; margin-top: 6px;">
                      Valid for 5 minutes. Never share this code.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 11px; color: #A8A29E; line-height: 1.5; margin: 20px 0 0 0;">
                If you did not initiate this request, change your credentials immediately or contact Shivam Optical support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF7F2; border-top: 1px solid #E8DEC8; padding: 22px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; color: #0A251C;">
                Shivam Optical Atelier &bull; Mayur Vihar Phase 1, Pocket 1, Delhi 110091
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
