'use server'

import { Resend } from 'resend';
import ApprovalEmail from '@/emails/ApprovalEmail';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function approveStudentAndEmail(registrationId: string, studentEmail: string, studentName: string, eventName: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 1. Update the database status to 'confirmed'
  const { error: dbError } = await supabase
    .from('event_registrations')
    .update({ status: 'confirmed' })
    .eq('id', registrationId);

  if (dbError) return { success: false, message: "Database update failed." };

  // 2. Send the automated email!
  try {
    const { error: emailError } = await resend.emails.send({
      from: 'SESC Portal <onboarding@resend.dev>', // Use this test email until you get a real domain
      to: [studentEmail],
      subject: `Ticket Approved: ${eventName}`,
      react: ApprovalEmail({ studentName, eventName }),
    });

    if (emailError) {
      console.error(emailError);
      return { success: false, message: "Approved, but email failed to send." };
    }

    return { success: true, message: "Student approved and email sent!" };
  } catch (error) {
    return { success: false, message: "System error while sending email." };
  }
}