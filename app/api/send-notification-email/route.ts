import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, recipientUserId, actorUserId, logId, logTitle, commentContent } = body
    
    console.log('Email notification request received:', { type, recipientUserId, actorUserId })

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    // Get recipient's profile and email
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', recipientUserId)
      .single()

    // Get actor's username
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', actorUserId)
      .single()

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }
    
    console.log('Resend API key found, proceeding with email send')

    // Get recipient's email using Supabase Admin API
    let recipientEmail: string | null = null
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(recipientUserId)
      
      if (userError) {
        console.error('Error getting user email:', userError)
        return NextResponse.json({ error: 'Failed to get recipient email' }, { status: 500 })
      }
      
      recipientEmail = userData?.user?.email || null
      console.log('Recipient email retrieved:', recipientEmail ? 'Found' : 'Not found')
    } else {
      console.error('SUPABASE_SERVICE_ROLE_KEY not set - cannot get user email')
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
    }

    if (!recipientEmail) {
      console.error('Could not find email for user:', recipientUserId)
      return NextResponse.json({ error: 'Recipient email not found' }, { status: 404 })
    }
    
    console.log('Preparing to send email to:', recipientEmail)

    // Send email using Resend
    // Use your verified domain to avoid spam. Get it from environment variable or use Resend's test domain
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'LearningLogs <onboarding@resend.dev>'
    
    const { data, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: getEmailSubject(type, actorProfile?.username || 'someone'),
      html: getEmailHtml(
        type,
        recipientProfile?.full_name || 'User',
        actorProfile?.username || 'someone',
        logTitle,
        commentContent
      ),
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: 'Failed to send email', details: emailError }, { status: 500 })
    }

    console.log('Email sent successfully:', data?.id)

    return NextResponse.json({ success: true, emailId: data?.id })
  } catch (error) {
    console.error('Error sending notification email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

function getEmailSubject(type: string, actorUsername: string): string {
  switch (type) {
    case 'follow':
      return `${actorUsername} started following you on LearningLogs`
    case 'comment':
      return `${actorUsername} commented on your log`
    case 'like':
      return `${actorUsername} liked your log`
    default:
      return 'New notification from LearningLogs'
  }
}

function getEmailHtml(
  type: string,
  recipientName: string,
  actorUsername: string,
  logTitle?: string,
  commentContent?: string
): string {
  let content = ''
  
  switch (type) {
    case 'follow':
      content = `<p><strong>@${actorUsername}</strong> started following you on LearningLogs!</p>`
      break
    case 'comment':
      content = `
        <p><strong>@${actorUsername}</strong> commented on your log "${logTitle}":</p>
        <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0;">${commentContent}</p>
      `
      break
    case 'like':
      content = `<p><strong>@${actorUsername}</strong> liked your log "${logTitle}"</p>`
      break
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #84cc16; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0;">LearningLogs</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #84cc16;">Hello ${recipientName || 'there'}!</h2>
          ${content}
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/notifications" 
               style="background: #84cc16; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Notifications
            </a>
          </p>
        </div>
      </body>
    </html>
  `
}

