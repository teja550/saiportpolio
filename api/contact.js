// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/contact
// Contact Form Submission & Email Delivery Handler
// ==============================================================================

// Simple in-memory rate limiting map for Vercel lambdas
const rateLimitMap = new Map();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Please submit via POST.',
    });
  }

  try {
    const { name, email, subject, message, bot_check } = req.body || {};

    // 1. Honeypot Anti-Spam Check
    if (bot_check && bot_check.trim() !== '') {
      // Spam bot detected - return success silently to fool the bot
      return res.status(200).json({
        success: true,
        message: 'Message sent successfully! I’ll get back to you soon.',
      });
    }

    // 2. Input Validation
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim();
    const trimmedSubject = (subject || '').trim();
    const trimmedMessage = (message || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        error: 'All required fields (Name, Email, Subject, Message) must be filled.',
      });
    }

    // Email format regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    // 3. Basic IP Rate Limiting (Max 5 submissions per 10 minutes)
    const clientIp =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const limit = 5;

    const ipData = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + windowMs };

    if (now > ipData.resetTime) {
      ipData.count = 1;
      ipData.resetTime = now + windowMs;
    } else {
      ipData.count += 1;
    }

    rateLimitMap.set(clientIp, ipData);

    if (ipData.count > limit) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a few minutes before trying again.',
      });
    }

    // Target recipient email
    const recipientEmail = process.env.TO_EMAIL || 'nagaramsaiteja57@gmail.com';

    // 4. Email Dispatching logic based on environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const web3FormsKey = process.env.WEB3FORMS_ACCESS_KEY;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    // PROVIDER 1: RESEND (Recommended)
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Contact Form <onboarding@resend.dev>',
          to: [recipientEmail],
          reply_to: trimmedEmail,
          subject: `Portfolio Contact: ${trimmedSubject}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #2563eb; margin-top: 0;">New Message from Portfolio Website</h2>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
              <p><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
              <p><strong>Email:</strong> <a href="mailto:${escapeHtml(trimmedEmail)}">${escapeHtml(trimmedEmail)}</a></p>
              <p><strong>Subject:</strong> ${escapeHtml(trimmedSubject)}</p>
              <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold;">Message:</p>
                <p style="margin-top: 8px; white-space: pre-wrap;">${escapeHtml(trimmedMessage)}</p>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Resend API Error:', errorData);
        return res.status(500).json({
          success: false,
          error: 'Unable to send your message. Please try again.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully! I’ll get back to you soon.',
      });
    }

    // PROVIDER 2: WEB3FORMS
    if (web3FormsKey) {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: web3FormsKey,
          name: trimmedName,
          email: trimmedEmail,
          subject: `Portfolio Contact: ${trimmedSubject}`,
          message: trimmedMessage,
          from_name: `${trimmedName} (Portfolio Form)`,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Web3Forms Error:', data);
        return res.status(500).json({
          success: false,
          error: 'Unable to send your message. Please try again.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully! I’ll get back to you soon.',
      });
    }

    // PROVIDER 3: NODEMAILER (GMAIL APP PASSWORD)
    if (gmailUser && gmailPass) {
      // Lazy import nodemailer
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      await transporter.sendMail({
        from: `"${trimmedName}" <${gmailUser}>`,
        to: recipientEmail,
        replyTo: trimmedEmail,
        subject: `Portfolio Contact: ${trimmedSubject}`,
        text: `Name: ${trimmedName}\nEmail: ${trimmedEmail}\nSubject: ${trimmedSubject}\n\nMessage:\n${trimmedMessage}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-top: 0;">New Message from Portfolio Website</h2>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <p><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(trimmedEmail)}">${escapeHtml(trimmedEmail)}</a></p>
            <p><strong>Subject:</strong> ${escapeHtml(trimmedSubject)}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold;">Message:</p>
              <p style="margin-top: 8px; white-space: pre-wrap;">${escapeHtml(trimmedMessage)}</p>
            </div>
          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully! I’ll get back to you soon.',
      });
    }

    // Fallback if no provider environment variables are configured
    console.warn(
      'No email API key configured. Please set RESEND_API_KEY, WEB3FORMS_ACCESS_KEY, or GMAIL_APP_PASSWORD in environment variables.'
    );
    return res.status(500).json({
      success: false,
      error:
        'Server configuration issue: Email service environment variables are missing on Vercel.',
    });
  } catch (err) {
    console.error('Contact endpoint error:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to send your message. Please try again.',
    });
  }
}

// Utility function to escape HTML special characters for security
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
