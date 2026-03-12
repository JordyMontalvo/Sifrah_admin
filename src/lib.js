import axios from 'axios'

const SERVER = process.env.VUE_APP_SERVER || ''

class Lib {
  async upload(file, fileName, dir) {
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    console.log(`[Lib] Direct CDN Upload: ${safeFileName} (${file.size} bytes)`);

    // Paso 1: Pedirle al servidor la URL de destino
    const metaRes = await fetch(`${SERVER}/api/auxi/bunny-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: safeFileName, dir })
    });

    if (!metaRes.ok) {
      const err = await metaRes.text();
      throw new Error(`No se pudo obtener URL de subida: ${err}`);
    }

    const { uploadUrl, publicUrl } = await metaRes.json();
    console.log(`[Lib] Uploading to CDN: ${uploadUrl}`);

    // Paso 2: El navegador sube el archivo DIRECTAMENTE a Bunny (sin pasar por Heroku)
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': process.env.VUE_APP_BUNNY_KEY,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Error subiendo a Bunny CDN (${uploadRes.status}): ${err}`);
    }

    console.log(`[Lib] CDN Upload SUCCESS: ${publicUrl}`);
    return publicUrl;
  }

  /**
   * Parsea una fecha de manera robusta, manejando formatos dd/mm/yyyy y mm/dd/yyyy
   * @param {string|Date|number} dateValue - Valor de fecha a parsear
   * @returns {Date} Objeto Date válido
   */
  parseDate(dateValue) {
    // Si ya es un objeto Date válido, retornarlo
    if (dateValue instanceof Date && !isNaN(dateValue)) {
      return dateValue
    }

    // Si es un número (timestamp), crear Date directamente
    if (typeof dateValue === 'number') {
      return new Date(dateValue)
    }

    // Si es null, undefined o string vacío, retornar fecha inválida
    if (!dateValue) {
      return new Date(NaN)
    }

    // Convertir a string
    const dateStr = String(dateValue).trim()

    // Si es una fecha ISO (YYYY-MM-DD o con T), usar directamente
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const date = new Date(dateStr)
      if (!isNaN(date)) return date
    }

    // Intentar parsear formatos con barras: dd/mm/yyyy o mm/dd/yyyy
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (slashMatch) {
      const [, part1, part2, year] = slashMatch
      const num1 = parseInt(part1, 10)
      const num2 = parseInt(part2, 10)
      const yearNum = parseInt(year, 10)

      // Si el primer número es > 12, debe ser día (formato dd/mm/yyyy)
      if (num1 > 12) {
        const date = new Date(yearNum, num2 - 1, num1)
        if (!isNaN(date) && date.getDate() === num1 && date.getMonth() === num2 - 1) {
          return date
        }
      }
      // Si el segundo número es > 12, debe ser mes (formato mm/dd/yyyy)
      else if (num2 > 12) {
        const date = new Date(yearNum, num1 - 1, num2)
        if (!isNaN(date) && date.getDate() === num2 && date.getMonth() === num1 - 1) {
          return date
        }
      }
      // Si ambos son <= 12, intentar ambos formatos y elegir el válido
      else {
        // Intentar primero como mm/dd/yyyy
        let date = new Date(yearNum, num1 - 1, num2)
        if (!isNaN(date) && date.getDate() === num2 && date.getMonth() === num1 - 1) {
          return date
        }
        // Si falla, intentar como dd/mm/yyyy
        date = new Date(yearNum, num2 - 1, num1)
        if (!isNaN(date) && date.getDate() === num1 && date.getMonth() === num2 - 1) {
          return date
        }
      }
    }

    // Como último recurso, intentar con el constructor Date estándar
    const date = new Date(dateStr)
    if (!isNaN(date)) {
      return date
    }

    // Si todo falla, retornar fecha inválida
    return new Date(NaN)
  }
}

export default new Lib()
