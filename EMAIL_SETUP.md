# Email Notifications Setup

This app includes email notification functionality for when users:
- Follow you
- Comment on your logs
- Like your logs

## ✅ Current Status

The email notification system is **fully integrated with Resend** and ready to use!

## Required Environment Variables

Add these to your `.env.local` file:

```env
RESEND_API_KEY=your_resend_api_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Getting Your Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)
4. Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important**: Never commit the service role key to git! It has admin access to your database.

## Resend Setup

1. ✅ Resend package is already installed
2. ✅ API key is configured in the code
3. **Next step**: Verify your domain in Resend (optional but recommended)

### Using Resend's Test Domain (Development)

For development, emails are sent from `onboarding@resend.dev` (Resend's test domain). These emails often go to spam.

### Using Your Own Domain (Recommended for Production)

To prevent emails from going to spam, verify your own domain in Resend:

1. **Add Domain in Resend:**
   - Go to Resend dashboard → **Domains**
   - Click **Add Domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Follow the verification steps

2. **Add DNS Records:**
   - Resend will provide DNS records (SPF, DKIM, DMARC)
   - Add these to your domain's DNS settings
   - Wait for verification (usually a few minutes)

3. **Update Environment Variable:**
   - Add to your `.env.local`:
     ```
     RESEND_FROM_EMAIL=LearningLogs <notifications@yourdomain.com>
     ```
   - Replace `yourdomain.com` with your actual verified domain

4. **Restart your server** - The code will automatically use your verified domain!

**Note:** Until you verify a domain, emails will use `onboarding@resend.dev` and may go to spam. Once you verify your domain and set `RESEND_FROM_EMAIL`, emails will be much less likely to go to spam.

## Email Template

The email template includes:
- Branded header with LearningLogs styling
- Personalized greeting with user's name
- Notification content based on type (follow/comment/like)
- Link to view notifications page

## How It Works

Emails are automatically sent when:
- ✅ Someone follows a user (via FollowButton)
- ✅ Someone comments on a log (via CommentSection)
- ✅ Someone likes a log (via ReactionButton)

The system:
1. Gets the recipient's email using Supabase Admin API
2. Gets the actor's username from profiles
3. Sends a formatted email via Resend
4. Logs success/errors to the console

## Testing

1. Make sure your `.env.local` has both `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
2. Test by having one user follow/comment/like another user's content
3. Check the recipient's email inbox
4. Check server logs for any errors

## Troubleshooting

- **"Email service not configured"**: Check that `RESEND_API_KEY` is set
- **"Service role key not configured"**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- **"Recipient email not found"**: User might not exist or email might not be verified
- **Resend errors**: Check Resend dashboard for delivery status and errors

