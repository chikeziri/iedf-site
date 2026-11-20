import { NextRequest, NextResponse } from "next/server";
import { memberApplicationSchema, givingIntentSchema } from "@/lib/validations/forms";
import { query } from "@/lib/db/client";
import { ensureAdminSchema } from "@/lib/admin/schema";
import { escapeHtml, sendNotificationEmail } from "@/lib/email/client";
import { leadFromRequest } from "@/lib/leads/attribution";
import { recordLead, withLead } from "@/lib/leads/record";

const interestLabels: Record<string, string> = {
  member: "Become a member",
  volunteer: "Volunteer",
  both: "Member + Volunteer",
  "giving-intent": "Giving interest (Support IEDF)",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const interest = text(formData, "interest");

  const parsed =
    interest === "giving-intent"
      ? givingIntentSchema.safeParse({
          interest: "giving-intent",
          email: text(formData, "email"),
          name: text(formData, "name") || undefined,
        })
      : memberApplicationSchema.safeParse({
          interest,
          name: text(formData, "name"),
          email: text(formData, "email"),
          phone: text(formData, "phone"),
          whatsapp: text(formData, "whatsapp") || undefined,
          residenceCountry: text(formData, "residenceCountry"),
          residenceState: text(formData, "residenceState"),
          residenceCity: text(formData, "residenceCity"),
          residenceAddress: text(formData, "residenceAddress"),
          birthPlace: text(formData, "birthPlace"),
          birthState: text(formData, "birthState"),
          birthCountry: text(formData, "birthCountry"),
          school: text(formData, "school"),
          qualification: text(formData, "qualification"),
          occupation: text(formData, "occupation"),
          reference1: {
            name: text(formData, "ref1Name"),
            phone: text(formData, "ref1Phone"),
            village: text(formData, "ref1Village"),
            relationship: text(formData, "ref1Relationship"),
          },
          reference2: {
            name: text(formData, "ref2Name"),
            phone: text(formData, "ref2Phone"),
            village: text(formData, "ref2Village"),
            relationship: text(formData, "ref2Relationship"),
          },
        });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const lead = leadFromRequest(request);

  try {
    await ensureAdminSchema();
    await query(
      `INSERT INTO submissions (form_type, payload, email) VALUES ($1, $2, $3)`,
      ["member_signup", JSON.stringify(withLead(parsed.data, lead)), parsed.data.email]
    );
    await recordLead(lead, "member", { email: parsed.data.email, path: "/join-us" });
  } catch (err) {
    console.error("[member signup] DB write failed:", err);
    return NextResponse.json(
      { success: false, errors: { _form: ["Something went wrong. Please try again."] } },
      { status: 500 }
    );
  }

  try {
    const data = parsed.data;
    const label = interestLabels[data.interest] ?? data.interest;
    const lines =
      data.interest === "giving-intent"
        ? ""
        : `
        <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
        ${data.whatsapp ? `<p><strong>WhatsApp:</strong> ${escapeHtml(data.whatsapp)}</p>` : ""}
        <p><strong>Lives in:</strong> ${escapeHtml(`${data.residenceAddress}, ${data.residenceCity}, ${data.residenceState}, ${data.residenceCountry}`)}</p>
        <p><strong>Born:</strong> ${escapeHtml(`${data.birthPlace}, ${data.birthState}, ${data.birthCountry}`)}</p>
        <p><strong>Schooled:</strong> ${escapeHtml(`${data.school} (${data.qualification})`)}</p>
        <p><strong>Work / income:</strong> ${escapeHtml(data.occupation)}</p>
        <p><strong>Reference 1:</strong> ${escapeHtml(`${data.reference1.name}, ${data.reference1.phone}, ${data.reference1.village} (${data.reference1.relationship})`)}</p>
        <p><strong>Reference 2:</strong> ${escapeHtml(`${data.reference2.name}, ${data.reference2.phone}, ${data.reference2.village} (${data.reference2.relationship})`)}</p>
      `;
    await sendNotificationEmail({
      subject: `New Join Us submission: ${label}`,
      html: `
        <h2>New Join Us Submission</h2>
        <p><strong>Interest:</strong> ${escapeHtml(label)}</p>
        ${data.name ? `<p><strong>Name:</strong> ${escapeHtml(data.name)}</p>` : ""}
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        ${lead ? `<p><strong>Lead:</strong> ${escapeHtml(lead.source)} / ${escapeHtml(lead.campaign)}</p>` : ""}
        ${lines}
      `,
    });
  } catch (err) {
    console.error("[member signup] notification email failed:", err);
  }

  return NextResponse.json({ success: true });
}
