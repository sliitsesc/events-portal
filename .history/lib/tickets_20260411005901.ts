import QRCode from "qrcode";

type TicketSeed = {
  registrationId: string;
  eventId: string;
  userId: string;
  issuedAt: string;
};

export function getTicketCode(registrationId: string): string {
  return `SESC-${registrationId.slice(0, 8).toUpperCase()}`;
}

export function buildTicketPayload(seed: TicketSeed): string {
  return JSON.stringify({
    version: 1,
    registrationId: seed.registrationId,
    eventId: seed.eventId,
    userId: seed.userId,
    issuedAt: seed.issuedAt,
  });
}

export async function buildTicketQrDataUrl(seed: TicketSeed): Promise<string> {
  const payload = buildTicketPayload(seed);

  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });
}
