import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

const WINDOW_MS = 48 * 60 * 60 * 1000;

function getNitKey(nit: string) {
  return String(nit || '')
    .trim()
    .replace(/[^0-9A-Za-z]/g, '')
    .toUpperCase();
}

@Injectable()
export class SolicitudService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly storePath = path.join(this.dataDir, 'last-requests.json');
  private readonly lastRequestsStore: Record<string, number>;

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

    const mailOptions = {
      from: process.env.MAIL_USER || 'no-reply@example.com',
      replyTo: correo,
      to: process.env.MAIL_TO || 'owner@example.com',
      subject: 'Nueva solicitud de acceso',
      text: `Nombre: ${nombre} ${apellido}\nCorreo: ${correo}\nEmpresa: ${empresa}\nCargo: ${cargo}\nNIT: ${nit}\nMensaje: ${mensaje}`,
    };

    try {
      this.lastRequestsStore[nitKey] = now;
      this.saveStore(this.lastRequestsStore);
      await this.transporter.sendMail(mailOptions as any);
      return { success: true, message: 'Solicitud enviada correctamente.' };
    } catch (error: any) {
      if (this.lastRequestsStore[nitKey]) {
        delete this.lastRequestsStore[nitKey];
        this.saveStore(this.lastRequestsStore);
      }
      throw new HttpException({ success: false, error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
