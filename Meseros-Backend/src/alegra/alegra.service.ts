import { Injectable } from '@nestjs/common';

@Injectable()
export class AlegraService {
  async crearFactura(restauranteConfig: any, facturaData: any): Promise<any> {
    const { alegra_api_key, alegra_email } = restauranteConfig || {};
    if (!alegra_api_key || !alegra_email) {
      return { ok: false, message: 'Alegra API key no configurada — factura no enviada a DIAN' };
    }

    const auth = Buffer.from(`${alegra_email}:${alegra_api_key}`).toString('base64');
    const payload = {
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      observations: `Pedido mesa ${facturaData.mesa}`,
      items: (facturaData.items || []).map((item: any) => ({
        id: item.producto_id,
        name: item.nombre,
        description: item.nombre,
        quantity: item.cantidad,
        price: item.precio,
        tax: [],
      })),
      payments: [
        {
          bankAccount: null,
          date: new Date().toISOString().split('T')[0],
          amount: facturaData.total,
          type: 'cash',
        },
      ],
    };

    try {
      // Llamada real a Alegra
      const res = await fetch('https://app.alegra.com/api/v1/invoices', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, message: 'Error al crear factura en Alegra', detail: json };
      }
      return { ok: true, factura: json };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Error conectando con Alegra', payload };
    }
  }
}
