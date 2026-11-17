import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set; registration emails are disabled.");
  }
  return new Resend(apiKey);
}

type RegistrationEmailParams = {
  to: string;
  eventTitle: string;
  startAt: string;
  endAt: string;
  locationLabel: string;
  eventUrl: string;
};

export async function sendRegistrationEmail({
  to,
  eventTitle,
  startAt,
  endAt,
  locationLabel,
  eventUrl,
}: RegistrationEmailParams) {
  const subject = `You're registered: ${eventTitle}`;

  const lines = [
    "Hi,",
    "",
    `Thanks for registering for ${eventTitle}.`,
    "",
    `When: ${startAt} – ${endAt}`,
    `Where: ${locationLabel}`,
    "",
    `Event page: ${eventUrl}`,
    "",
    "See you there!",
    "SESC Events",
  ];

  await getResend().emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ??
      "SESC Events <events@events.sliitsesc.org>",
    to,
    subject,
    text: lines.join("\n"),
  });
}
