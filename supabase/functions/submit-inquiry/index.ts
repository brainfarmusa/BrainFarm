import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://brainfarmusa.com", "https://www.brainfarmusa.com",
  "https://brainfarmusa.github.io", "https://brain-farm-usa-site.darrell217587.chatgpt.site",
]);
const ALLOWED_TYPES = new Set([
  "application/pdf", "text/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/png",
]);
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;

function cors(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://brainfarmusa.github.io";
  return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] as string));
}
function safeName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120);
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });

  try {
    const data = await request.formData();
    if (String(data.get("Website") || "").trim()) return new Response(JSON.stringify({ reference: "received" }), { headers });
    const type = String(data.get("Inquiry type") || "");
    const name = String(data.get("Name") || "").trim();
    const company = String(data.get("Company") || "").trim();
    const email = String(data.get("Email") || "").trim().toLowerCase();
    const phone = String(data.get("Phone") || "").trim();
    if (!["quote", "want-to-buy", "want-to-sell"].includes(type)) throw new Error("Invalid inquiry type.");
    if (!name || !company || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please provide your name, company and a valid email address.");

    const files = data.getAll("Attachments").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length > MAX_FILES) throw new Error("Please attach no more than five files.");
    for (const file of files) {
      if (file.size > MAX_SIZE) throw new Error(`Attachment ${file.name} is larger than 10MB.`);
      if (!ALLOWED_TYPES.has(file.type)) throw new Error(`Attachment type not allowed: ${file.name}`);
    }

    const formData: Record<string, string> = {};
    for (const [key, value] of data.entries()) {
      if (key !== "Attachments" && key !== "Website" && key !== "Inquiry type") formData[key] = String(value).trim();
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: inquiry, error: insertError } = await supabase.from("inquiries").insert({ inquiry_type: type, name, company, email, phone: phone || null, form_data: formData }).select("id").single();
    if (insertError) throw insertError;

    const uploaded: Array<{ name: string; url: string }> = [];
    for (const file of files) {
      const path = `${inquiry.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("inquiry-files").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: fileError } = await supabase.from("inquiry_files").insert({ inquiry_id: inquiry.id, original_name: file.name, storage_path: path, content_type: file.type, size_bytes: file.size });
      if (fileError) throw fileError;
      const { data: signed } = await supabase.storage.from("inquiry-files").createSignedUrl(path, 60 * 60 * 24 * 7);
      uploaded.push({ name: file.name, url: signed?.signedUrl || "" });
    }

    const labels: Record<string, string> = { quote: "Request a Quote", "want-to-buy": "Want to Buy", "want-to-sell": "Want to Sell / Trade In" };
    const details = Object.entries(formData).map(([key, value]) => `<tr><th style="text-align:left;padding:7px 12px;background:#eef4f8;border-bottom:1px solid #d8e2e9">${escapeHtml(key)}</th><td style="padding:7px 12px;border-bottom:1px solid #d8e2e9;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join("");
    const fileList = uploaded.length ? `<h3>Secure attachments (links expire in 7 days)</h3><ul>${uploaded.map((file) => `<li><a href="${escapeHtml(file.url)}">${escapeHtml(file.name)}</a></li>`).join("")}</ul>` : "<p>No files attached.</p>";
    const resend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: Deno.env.get("FROM_EMAIL"), to: [Deno.env.get("NOTIFICATION_EMAIL")], reply_to: email, subject: `BrainFarm USA Website — ${labels[type]} — ${company}`, html: `<div style="font-family:Arial,sans-serif;color:#132238;max-width:760px"><h1>${labels[type]}</h1><p><strong>Reference:</strong> ${inquiry.id}</p><table style="border-collapse:collapse;width:100%">${details}</table>${fileList}</div>` }),
    });
    await supabase.from("inquiries").update({ status: resend.ok ? "notified" : "notification_failed" }).eq("id", inquiry.id);
    return new Response(JSON.stringify({ reference: inquiry.id.slice(0, 8).toUpperCase() }), { headers });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Submission failed." }), { status: 400, headers });
  }
});
