import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

const WINDOW_MS = 48 * 60 * 60 * 1000;

// Notificación al estudio: Gmail/SMTP (sin Resend).
const MAIL_TO = process.env.MAIL_TO || 'llanostudioco@gmail.com';

// Confirmación al solicitante: Resend, reutilizando el dominio verificado de Llano Studio.
//   RESEND_API_KEY → API key (re_...). Si falta, no se envía la confirmación.
//   MAIL_FROM      → remitente verificado. Ej: "Mesoft <no-reply@llanostudio.co>"
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'Mesoft <no-reply@llanostudio.co>';

// Reenvío al panel /admin de LlanoStudio para poder responder a los clientes desde ahí.
//   LLANO_API_BASE → base de la API de LlanoStudio. Ej: https://llanostudio.co
//   LLANO_INTAKE_SECRET → secreto compartido para autorizar el reenvío.
const LLANO_API_BASE = (process.env.LLANO_API_BASE || '').replace(/\/$/, '');
const LLANO_INTAKE_SECRET = process.env.LLANO_INTAKE_SECRET || '';

function getNitKey(nit: string) {
  return String(nit || '')
    .trim()
    .replace(/[^0-9A-Za-z]/g, '')
    .toUpperCase();
}

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(s: any): string {
  return esc(s).replace(/\n/g, '<br>');
}

const MESOFT_LOGO = process.env.MESOFT_LOGO_URL || 'https://mesoft.store/logopngmesoft.png';
const LS_LOGO_LIGHT = process.env.LS_LOGO_URL || 'https://llanostudio.co/assets/ls-logo-light.png';
// Contacto de Llano Studio (se muestra en el pie de los correos de Mesoft).
const WHATSAPP_URL = 'https://wa.me/573159620824';
const WHATSAPP_LABEL = '+57 315 9620824';

/** Layout de los correos: marca Mesoft + pie "Un producto de Llano Studio". Responsive. */
function layout(opts: { heading: string; intro?: string; bodyHtml: string; footerNote?: string }): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<style>
  @media only screen and (max-width:620px) {
    .ms-card { border-radius:0 !important; }
    .ms-pad  { padding-left:22px !important; padding-right:22px !important; }
    .ms-pad-y { padding-top:26px !important; padding-bottom:26px !important; }
    .ms-h1   { font-size:21px !important; }
    .ms-outer { padding:0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#eef0f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f3;">
    <tr><td class="ms-outer" align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="ms-card" style="max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e5ea;box-shadow:0 12px 44px -18px rgba(12,17,25,.28);">

        <!-- Header con logo Mesoft -->
        <tr><td class="ms-pad" style="padding:24px 36px 18px 36px;background:#ffffff;">
          <img src="${MESOFT_LOGO}" alt="Mesoft" height="34" style="height:34px;width:auto;vertical-align:middle;border:0;">
          <span style="font-size:19px;font-weight:800;color:#0c1119;letter-spacing:-0.02em;vertical-align:middle;margin-left:8px;">Mesoft</span>
        </td></tr>

        <!-- Banda de acento naranja -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#fb7427,#fb923c);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Contenido -->
        <tr><td class="ms-pad ms-pad-y" style="padding:38px 36px;">
          <h1 class="ms-h1" style="margin:0 0 14px;font-size:25px;color:#0c1119;letter-spacing:-0.02em;font-weight:800;">${esc(opts.heading)}</h1>
          ${opts.intro ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#475068;">${opts.intro}</p>` : ''}
          ${opts.bodyHtml}
        </td></tr>

        <!-- Footer Mesoft: texto + contacto (izq) · logos (der) -->
        <tr><td class="ms-pad" style="padding:26px 36px;background:#0c1119;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:15px;color:#ffffff;font-weight:700;letter-spacing:-0.01em;">Mesoft</p>
              <p style="margin:0 0 12px;font-size:12px;color:#8893a7;letter-spacing:.06em;text-transform:uppercase;">Gestión para restaurantes</p>
              <p style="margin:0 0 6px;font-size:13.5px;"><a href="https://mesoft.store" target="_blank" style="color:#fb923c;text-decoration:none;">mesoft.store</a></p>
              <p style="margin:0;font-size:13.5px;color:#8893a7;">Tel: <a href="${WHATSAPP_URL}" target="_blank" style="color:#9db2ff;text-decoration:none;">${WHATSAPP_LABEL}</a></p>
            </td>
            <td align="right" style="vertical-align:top;">
              <img src="${MESOFT_LOGO}" alt="Mesoft" height="42" style="height:42px;width:auto;border:0;display:inline-block;">
              <div style="margin-top:12px;">
                <img src="${LS_LOGO_LIGHT}" alt="Llano Studio" height="14" style="height:14px;width:auto;vertical-align:middle;opacity:.9;border:0;">
                <span style="color:#8893a7;font-size:11.5px;vertical-align:middle;margin-left:6px;">Un producto de <a href="https://llanostudio.co" target="_blank" style="color:#9db2ff;text-decoration:none;">Llano Studio</a></span>
              </div>
            </td>
          </tr></table>
          ${opts.footerNote ? `<p style="margin:16px 0 0;font-size:11.5px;line-height:1.6;color:#5e6675;">${opts.footerNote}</p>` : ''}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

const quoteBox = (text: string) =>
  `<div style="background:#f6f7f9;border:1px solid #e6e8ec;border-left:3px solid #fb7427;border-radius:8px;padding:14px 16px;font-size:14.5px;line-height:1.65;color:#2c3344;">${nl2br(text)}</div>`;

@Injectable()
export class SolicitudService {
  private readonly logger = new Logger(SolicitudService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly storePath = path.join(this.dataDir, 'last-requests.json');
  private readonly lastRequestsStore: Record<string, number>;

  // Gmail/SMTP para la notificación al estudio (sin Resend).
  private readonly transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.MAIL_USER || 'set-env-user@example.com',
      pass: process.env.MAIL_PASS || 'set-env-pass',
    },
  });

  constructor() {
    this.lastRequestsStore = this.loadStore();
  }

  private ensureDataDir() {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  private loadStore(): Record<string, number> {
    this.ensureDataDir();
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        return JSON.parse(raw || '{}');
      }
    } catch {
      // ignore
    }
    return {};
  }

  private saveStore(store: Record<string, number>) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(this.storePath, JSON.stringify(store, null, 2), 'utf8');
    } catch {
      // ignore
    }
  }

  /** Confirmación al solicitante vía la REST API de Resend. */
  private async sendConfirmationViaResend(opts: { to: string; subject: string; html: string }) {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada.');
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: opts.to,
        reply_to: MAIL_TO,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Resend ${res.status}: ${detail}`);
    }
  }

  /** Reenvía la solicitud al panel /admin de LlanoStudio para poder responderla desde ahí. */
  private async forwardToLlanoStudio(payload: {
    nombreCompleto: string;
    correo: string;
    empresa: string;
    cargo: string;
    nit: string;
    mensaje: string;
  }) {
    if (!LLANO_API_BASE || !LLANO_INTAKE_SECRET) {
      this.logger.warn('Reenvío a LlanoStudio omitido (falta LLANO_API_BASE o LLANO_INTAKE_SECRET).');
      return;
    }
    // Se arma el "mensaje" con todos los datos para que el admin tenga contexto al responder.
    const message = [
      `Empresa: ${payload.empresa || '—'}`,
      `NIT: ${payload.nit || '—'}`,
      `Cargo: ${payload.cargo || '—'}`,
      '',
      payload.mensaje || '(Sin mensaje adicional)',
    ].join('\n');

    const res = await fetch(`${LLANO_API_BASE}/api/contact/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-intake-secret': LLANO_INTAKE_SECRET,
      },
      body: JSON.stringify({
        name: payload.nombreCompleto,
        email: payload.correo,
        message,
        source: 'mesoft',
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Intake ${res.status}: ${detail}`);
    }
  }

  async sendSolicitud(body: any) {
    const { nombre, apellido, correo, empresa, cargo, nit, mensaje } = body || {};
    if (!nit) {
      throw new HttpException({ success: false, error: 'NIT requerido.' }, HttpStatus.BAD_REQUEST);
    }

    const now = Date.now();
    const nitKey = getNitKey(String(nit));
    const last = this.lastRequestsStore[nitKey];
    if (last && now - last < WINDOW_MS) {
      const remainMs = WINDOW_MS - (now - last);
      const waitHours = Math.ceil(remainMs / (60 * 60 * 1000));
      const nextAllowedAt = new Date(last + WINDOW_MS).toISOString();
      return {
        success: false,
        code: 'RATE_LIMIT',
        message: `Ya enviaste una solicitud para el NIT ${nit}. Vuelve a intentarlo en ${waitHours} hora(s).`,
        waitHours,
        nextAllowedAt,
      };
    }

    const nombreCompleto = `${nombre ?? ''} ${apellido ?? ''}`.trim() || 'Sin nombre';

    // 1) Notificación al estudio (Gmail, sin Resend). Obligatoria: si falla, se revierte el rate-limit.
    try {
      this.lastRequestsStore[nitKey] = now;
      this.saveStore(this.lastRequestsStore);

      await this.transporter.sendMail({
        from: process.env.MAIL_USER || 'no-reply@example.com',
        replyTo: correo,
        to: MAIL_TO,
        subject: `Nueva solicitud de acceso — ${empresa || nombreCompleto}`,
        text:
          `Nombre: ${nombreCompleto}\nCorreo: ${correo}\nEmpresa: ${empresa}\n` +
          `Cargo: ${cargo}\nNIT: ${nit}\nMensaje: ${mensaje || '(sin mensaje)'}`,
        html: layout({
          heading: 'Nueva solicitud de acceso',
          intro: 'Llegó una nueva solicitud desde el formulario de <strong>mesoft.store</strong>.',
          bodyHtml: `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;font-size:14.5px;color:#2c3344;">
              <tr><td style="padding:4px 0;color:#8893a7;width:90px;">Nombre</td><td style="padding:4px 0;font-weight:600;">${esc(nombreCompleto)}</td></tr>
              <tr><td style="padding:4px 0;color:#8893a7;">Correo</td><td style="padding:4px 0;"><a href="mailto:${esc(correo)}" style="color:#fb7427;text-decoration:none;">${esc(correo)}</a></td></tr>
              <tr><td style="padding:4px 0;color:#8893a7;">Empresa</td><td style="padding:4px 0;font-weight:600;">${esc(empresa)}</td></tr>
              <tr><td style="padding:4px 0;color:#8893a7;">Cargo</td><td style="padding:4px 0;">${esc(cargo)}</td></tr>
              <tr><td style="padding:4px 0;color:#8893a7;">NIT</td><td style="padding:4px 0;">${esc(nit)}</td></tr>
            </table>
            ${mensaje ? quoteBox(mensaje) : '<p style="margin:0;font-size:13px;color:#8893a7;">Sin mensaje adicional.</p>'}
            <p style="margin:18px 0 0;font-size:13px;color:#8893a7;">Responde a este correo o desde el panel de Llano Studio.</p>`,
        }),
      } as any);
    } catch (error: any) {
      if (this.lastRequestsStore[nitKey]) {
        delete this.lastRequestsStore[nitKey];
        this.saveStore(this.lastRequestsStore);
      }
      this.logger.error(`Fallo al enviar la notificación de solicitud: ${error?.message}`);
      throw new HttpException(
        { success: false, error: 'No se pudo enviar la solicitud. Intenta más tarde.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 2) Confirmación al solicitante (Resend). Best-effort.
    if (correo) {
      try {
        await this.sendConfirmationViaResend({
          to: correo,
          subject: 'Recibimos tu solicitud — Mesoft',
          html: layout({
            heading: `¡Gracias por tu interés, ${esc(String(nombre || '').split(' ')[0] || '')}!`,
            intro:
              'Recibimos tu solicitud de acceso y nuestro equipo ya está revisando tu información. Te contactaremos pronto con los siguientes pasos.',
            bodyHtml: `
              <p style="margin:0 0 16px;font-size:14.5px;line-height:1.65;color:#475068;">Esto fue lo que registramos:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14.5px;color:#2c3344;">
                <tr><td style="padding:4px 0;color:#8893a7;width:90px;">Empresa</td><td style="padding:4px 0;font-weight:600;">${esc(empresa)}</td></tr>
                <tr><td style="padding:4px 0;color:#8893a7;">NIT</td><td style="padding:4px 0;">${esc(nit)}</td></tr>
              </table>
              <p style="margin:20px 0 0;font-size:14.5px;color:#475068;">— El equipo de Mesoft</p>`,
            footerNote: 'Recibiste este correo porque enviaste el formulario de solicitud en mesoft.store',
          }),
        });
      } catch (error: any) {
        this.logger.warn(`No se pudo enviar la confirmación al solicitante: ${error?.message}`);
      }
    }

    // 3) Reenvío al panel /admin de LlanoStudio. Best-effort.
    try {
      await this.forwardToLlanoStudio({ nombreCompleto, correo, empresa, cargo, nit, mensaje });
    } catch (error: any) {
      this.logger.warn(`No se pudo reenviar la solicitud a LlanoStudio: ${error?.message}`);
    }

    return { success: true, message: 'Solicitud enviada correctamente.' };
  }
}
