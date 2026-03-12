import axios from 'axios'

const SERVER = process.env.VUE_APP_SERVER || ''

class Lib {
  async upload(file, fileName, dir) {
    return new Promise((resolve, reject) => {
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      console.log(`[Lib] Safe-JSON Start: ${safeFileName}`);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // Extraer solo la parte base64 (quitando el prefijo de data:...)
          const base64Data = reader.result.split(',')[1];

          const response = await fetch(`${SERVER}/api/auxi/bunny-upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: safeFileName,
              dir: dir,
              fileData: base64Data
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }

          const data = await response.json();
          console.log(`[Lib] SUCCESS: ${data.url}`);
          resolve(data.url);
        } catch (err) {
          console.error('[Lib] Safe-JSON Error:', err);
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer archivo local'));
      reader.readAsDataURL(file);
    });
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
