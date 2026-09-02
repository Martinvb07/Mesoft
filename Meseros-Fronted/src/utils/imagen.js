/* Pide a Cloudinary la imagen ya recortada y optimizada en vez de traer el
   original de 3 MB que subió el dueño desde el celular:
     f_auto  → WebP/AVIF según el navegador
     q_auto  → calidad automática
     c_fill  → recorta al encuadre pedido, centrado (bien para fotos)
     c_fit   → encaja la imagen completa sin cortarla (bien para ilustraciones)
     e_trim  → quita el borde de un solo color que rodea al dibujo, para que
               ilustraciones con distinto margen (una de 1024x1024 cuyo icono
               ocupa 547x381 y otra 547x583) se vean del mismo tamaño.
   Si la URL no es de Cloudinary (una ruta local como /categorias/x.jpg, o una
   URL externa) se devuelve igual, sin tocar. */
export const imagenTransformada = (url, { w = 600, h = 400, modo = 'fill', recortarBorde = false } = {}) => {
    const s = String(url || '');
    if (!s || !s.includes('/image/upload/')) return s;
    const cadena = (recortarBorde ? 'e_trim/' : '') + `f_auto,q_auto,c_${modo},w_${w},h_${h}`;
    return s.replace('/image/upload/', `/image/upload/${cadena}/`);
};
