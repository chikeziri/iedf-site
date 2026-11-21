import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema, inquiryRoutingMap } from "@/lib/validations/forms";
import { query } from "@/lib/db/client";
import { ensureAdminSchema } from "@/lib/admin/schema";
import { escapeHtml, sendNotificationEmail } from "@/lib/email/client";
import { leadFromRequest } from "@/lib/leads/attribution";
import { recordLead, withLead } from "@/lib/leads/record";

/**
 * TODO (remaining Milestone 4 work per Development Roadmap):
 *   Add Cloudflare Turnstile verification before processing.
 *
 * Note on `recipient`: the inquiryRoutingMap addresses (investors@iedf.org,
 * etc.) are placeholders from the original architecture doc — they may not
 * be real, checked mailboxes yet. Until IEDF confirms real departmental
 * inboxes exist, every notification goes to the single ADMIN_NOTIFICATION_EMAIL
 * address instead, with the "would route to" address included in the email
 * body so whoever receives it knows how to forward it internally.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const parsed = contactFormSchema.safeParse({
    inquiryType: formData.get("inquiryType"),
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const recipient = inquiryRoutingMap[parsed.data.inquiryType];

  const lead = leadFromRequest(request);
  const d = parsed.data;
  const html = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Inquiry type:</strong> ${escapeHtml(d.inquiryType)} (would route to: ${escapeHtml(recipient)})</p>
        <p><strong>Name:</strong> ${escapeHtml(d.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(d.email)}</p>
        ${d.organization ? `<p><strong>Organization:</strong> ${escapeHtml(d.organization)}</p>` : ""}
        ${lead ? `<p><strong>Lead:</strong> ${escapeHtml(lead.source)} / ${escapeHtml(lead.campaign)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(d.message)}</p>
      `;

  let saved = false;
  try {
    await ensureAdminSchema();
    await query(
      `INSERT INTO submissions (form_type, payload, email) VALUES ($1, $2, $3)`,
      ["contact", JSON.stringify(withLead(d, lead)), d.email]
    );
    saved = true;
    await recordLead(lead, "contact", { email: d.email, path: "/contact" });
  } catch (err) {
    console.error("[contact submission] DB write failed:", err);
  }

  let delivered = false;
  try {
    const sent = await sendNotificationEmail({
      subject: `New ${d.inquiryType} inquiry from ${d.name}`,
      html,
    });
    delivered = Boolean(sent) && !("skipped" in sent && sent.skipped);
  } catch (err) {
    console.error("[contact submission] notification email failed:", err);
  }

  if (!saved && !delivered) {
    return NextResponse.json(
      { success: false, errors: { _form: ["Something went wrong. Please try again or email us directly."] } },
      { status: 500 }
    );
  }

  console.log("[contact submission] saved:", saved, "emailed:", delivered, "would route to:", recipient);
  return NextResponse.json({ success: true });
}
