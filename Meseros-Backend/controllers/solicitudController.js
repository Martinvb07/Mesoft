const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configura el transporter con tus credenciales de Gmail (fijo)
const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.MAIL_USER || 'set-env-user@example.com',
        pass: process.env.MAIL_PASS || 'set-env-pass'
    }
});

// Persistencia simple en archivo + memoria (nit normalizado -> timestamp)
const WINDOW_MS = 48 * 60 * 60 * 1000; // 48 horas
const DATA_DIR = path.join(__dirname, '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'last-requests.json');

function ensureDataDir() {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

function loadStore() {
    ensureDataDir();
    try {
        if (fs.existsSync(STORE_PATH)) {
            const raw = fs.readFileSync(STORE_PATH, 'utf8');
            return JSON.parse(raw || '{}');
        }
    } catch {}
    return {};
}

function saveStore(store) {
    try { fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8'); } catch {}
}

const lastRequestsStore = loadStore();

function getNitKey(nit) {
    return String(nit || '').trim().replace(/[^0-9A-Za-z]/g, '').toUpperCase();
}

exports.sendSolicitud = async (req, res) => {
    const { nombre, apellido, correo, empresa, cargo, nit, mensaje } = req.body;

    // Validación NIT básico
    if (!nit) {
        return res.status(400).json({ success: false, error: 'NIT requerido.' });
    }

    const now = Date.now();
    const nitKey = getNitKey(nit);
    const last = lastRequestsStore[nitKey];
    if (last && (now - last) < WINDOW_MS) {
        const remainMs = WINDOW_MS - (now - last);
        const waitHours = Math.ceil(remainMs / (60 * 60 * 1000));
        const nextAllowedAt = new Date(last + WINDOW_MS).toISOString();
        return res.status(200).json({
            success: false,
            code: 'RATE_LIMIT',
            message: `Ya enviaste una solicitud para el NIT ${nit}. Vuelve a intentarlo en ${waitHours} hora(s).`,
            waitHours,
            nextAllowedAt
        });
    }

    const mailOptions = {
        // Desde la cuenta autenticada; Gmail rechaza remitentes que no coinciden si no está configurado send-as
        from: process.env.MAIL_USER || 'no-reply@example.com',
        // Para poder responderle al solicitante cómodamente
        replyTo: correo,
        to: process.env.MAIL_TO || 'owner@example.com',
        subject: 'Nueva solicitud de acceso',
        text: `Nombre: ${nombre} ${apellido}\nCorreo: ${correo}\nEmpresa: ${empresa}\nCargo: ${cargo}\nNIT: ${nit}\nMensaje: ${mensaje}`
    };

    try {
        // Bloquea inmediatamente para evitar spam; si falla el envío, se libera abajo
        lastRequestsStore[nitKey] = now;
        saveStore(lastRequestsStore);
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Solicitud enviada correctamente.' });
    } catch (error) {
        // Libera el bloqueo si el correo falló
        const nitKeyFail = getNitKey(nit);
        if (lastRequestsStore[nitKeyFail]) {
            delete lastRequestsStore[nitKeyFail];
            saveStore(lastRequestsStore);
        }
        return res.status(500).json({ success: false, error: error.message });
    }
};
