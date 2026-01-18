// Email template utilities
function formatEuroAmount(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Base HTML template
function wrapEmailContent(content: string, organizationName: string): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #3b82f6; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">ChoirOS</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${organizationName}</p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">Gestione Corale Professionale</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export interface EventInviteData {
  recipientName: string;
  eventTitle: string;
  eventType: string;
  eventDate: Date;
  eventLocation?: string;
  eventUrl: string;
  organizationName: string;
}

export function generateEventInviteEmail(data: EventInviteData): { html: string; text: string } {
  const eventTypeLabels: Record<string, string> = {
    rehearsal: "Prova",
    concert: "Concerto",
    meeting: "Riunione",
    other: "Evento",
  };

  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">Nuovo Evento: ${data.eventTitle}</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ciao ${data.recipientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      È stato creato un nuovo evento a cui sei invitato/a:
    </p>
    <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px;"><strong>Tipo:</strong> ${eventTypeLabels[data.eventType] || data.eventType}</p>
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px;"><strong>Data:</strong> ${formatDateTime(data.eventDate)}</p>
      ${data.eventLocation ? `<p style="margin: 0; color: #111827; font-size: 16px;"><strong>Luogo:</strong> ${data.eventLocation}</p>` : ""}
    </div>
    <p style="margin: 0 0 25px 0; text-align: center;">
      <a href="${data.eventUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Visualizza Evento</a>
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Ricordati di confermare la tua presenza!
    </p>
  `;

  const text = `
Nuovo Evento: ${data.eventTitle}

Ciao ${data.recipientName},

È stato creato un nuovo evento a cui sei invitato/a:

Tipo: ${eventTypeLabels[data.eventType] || data.eventType}
Data: ${formatDateTime(data.eventDate)}
${data.eventLocation ? `Luogo: ${data.eventLocation}` : ""}

Visualizza evento: ${data.eventUrl}

Ricordati di confermare la tua presenza!

---
${data.organizationName}
  `;

  return {
    html: wrapEmailContent(content, data.organizationName),
    text: text.trim(),
  };
}

export interface RegistrationConfirmationData {
  recipientName: string;
  voiceSection: string;
  organizationName: string;
}

export function generateRegistrationConfirmationEmail(data: RegistrationConfirmationData): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">Richiesta di Iscrizione Ricevuta</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ciao ${data.recipientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Abbiamo ricevuto la tua richiesta di iscrizione a <strong>${data.organizationName}</strong>.
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px;"><strong>Sezione Vocale:</strong> ${data.voiceSection}</p>
      <p style="margin: 0; color: #059669; font-size: 14px;">✓ Richiesta in attesa di approvazione</p>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Riceverai una email di conferma non appena la tua iscrizione sarà approvata.
    </p>
  `;

  const text = `
Richiesta di Iscrizione Ricevuta

Ciao ${data.recipientName},

Abbiamo ricevuto la tua richiesta di iscrizione a ${data.organizationName}.

Sezione Vocale: ${data.voiceSection}
Stato: In attesa di approvazione

Riceverai una email di conferma non appena la tua iscrizione sarà approvata.

---
${data.organizationName}
  `;

  return {
    html: wrapEmailContent(content, data.organizationName),
    text: text.trim(),
  };
}

export interface RegistrationApprovalData {
  recipientName: string;
  loginUrl: string;
  organizationName: string;
}

export function generateRegistrationApprovalEmail(data: RegistrationApprovalData): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">🎉 Iscrizione Approvata!</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ciao ${data.recipientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Siamo felici di informarti che la tua iscrizione a <strong>${data.organizationName}</strong> è stata approvata!
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0; color: #059669; font-size: 16px;">✓ Ora puoi accedere alla piattaforma</p>
    </div>
    <p style="margin: 0 0 25px 0; text-align: center;">
      <a href="${data.loginUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Accedi alla Piattaforma</a>
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Benvenuto/a nel coro!
    </p>
  `;

  const text = `
🎉 Iscrizione Approvata!

Ciao ${data.recipientName},

Siamo felici di informarti che la tua iscrizione a ${data.organizationName} è stata approvata!

Ora puoi accedere alla piattaforma: ${data.loginUrl}

Benvenuto/a nel coro!

---
${data.organizationName}
  `;

  return {
    html: wrapEmailContent(content, data.organizationName),
    text: text.trim(),
  };
}

export interface RegistrationRejectionData {
  recipientName: string;
  reason?: string;
  organizationName: string;
}

export function generateRegistrationRejectionEmail(data: RegistrationRejectionData): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">Richiesta di Iscrizione</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ciao ${data.recipientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ci dispiace informarti che al momento non possiamo accettare la tua richiesta di iscrizione a <strong>${data.organizationName}</strong>.
    </p>
    ${
      data.reason
        ? `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Motivo:</strong> ${data.reason}</p>
    </div>
    `
        : ""
    }
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Ti invitiamo a riprovare in futuro. Grazie per il tuo interesse!
    </p>
  `;

  const text = `
Richiesta di Iscrizione

Ciao ${data.recipientName},

Ci dispiace informarti che al momento non possiamo accettare la tua richiesta di iscrizione a ${data.organizationName}.

${data.reason ? `Motivo: ${data.reason}` : ""}

Ti invitiamo a riprovare in futuro. Grazie per il tuo interesse!

---
${data.organizationName}
  `;

  return {
    html: wrapEmailContent(content, data.organizationName),
    text: text.trim(),
  };
}

export interface PaymentDueData {
  recipientName: string;
  amount: number;
  dueDate: Date;
  description: string;
  paymentUrl: string;
  organizationName: string;
}

export function generatePaymentDueEmail(data: PaymentDueData): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">Pagamento in Scadenza</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ciao ${data.recipientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ti ricordiamo che hai un pagamento in scadenza:
    </p>
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 18px;"><strong>Importo:</strong> ${formatEuroAmount(data.amount)}</p>
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px;"><strong>Scadenza:</strong> ${formatDate(data.dueDate)}</p>
      <p style="margin: 0; color: #111827; font-size: 14px;"><strong>Descrizione:</strong> ${data.description}</p>
    </div>
    <p style="margin: 0 0 25px 0; text-align: center;">
      <a href="${data.paymentUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">Visualizza Pagamento</a>
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Per favore, effettua il pagamento entro la data di scadenza.
    </p>
  `;

  const text = `
Pagamento in Scadenza

Ciao ${data.recipientName},

Ti ricordiamo che hai un pagamento in scadenza:

Importo: ${formatEuroAmount(data.amount)}
Scadenza: ${formatDate(data.dueDate)}
Descrizione: ${data.description}

Visualizza pagamento: ${data.paymentUrl}

Per favore, effettua il pagamento entro la data di scadenza.

---
${data.organizationName}
  `;

  return {
    html: wrapEmailContent(content, data.organizationName),
    text: text.trim(),
  };
}

export interface PaymentConfirmationData {
  recipientName: string;
  amount: number;
  paymentDate: Date;
  description: string;
  organizationName: string;
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationData): { html: string; text: string } {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">✓ Pagamento Confermato</h2>
    <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Ciao ${data.recipientName},
    </p>
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
      Abbiamo ricevuto il tuo pagamento. Grazie!
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 18px;"><strong>Importo:</strong> ${formatEuroAmount(data.amount)}</p>
      <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px;"><strong>Data:</strong> ${formatDate(data.paymentDate)}</p>
      <p style="margin: 0; color: #111827; font-size: 14px;"><strong>Descrizione:</strong> ${data.description}</p>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      Questa email serve come conferma del pagamento ricevuto.
    </p>
  `;

  const text = `
✓ Pagamento Confermato

Ciao ${data.recipientName},

Abbiamo ricevuto il tuo pagamento. Grazie!

Importo: ${formatEuroAmount(data.amount)}
Data: ${formatDate(data.paymentDate)}
Descrizione: ${data.description}

Questa email serve come conferma del pagamento ricevuto.

---
${data.organizationName}
  `;

  return {
    html: wrapEmailContent(content, data.organizationName),
    text: text.trim(),
  };
}
