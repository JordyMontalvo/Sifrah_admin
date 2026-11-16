// Hoja del Libro de Reclamaciones en PDF (mismo formato que la copia que descarga
// el consumidor en la app, más el estado y la respuesta registrados en el admin).
import { jsPDF } from "jspdf";

const BRAND = [233, 30, 99];

export function formatLimaDate(value) {
  return new Date(value).toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatLimaTime(value) {
  return new Date(value).toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function downloadComplaintPdf(r) {
  const c = r.consumer || {};
  const p = r.product || {};
  const d = r.detail || {};
  const company = r.company || {};

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  let y = 0;

  const ensure = (h) => {
    if (y + h > H - 16) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setFillColor(...BRAND);
  doc.rect(0, 0, W, 6, "F");
  y = 20;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(18);
  doc.text("LIBRO DE RECLAMACIONES", M, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(`${company.name || ""}  ·  RUC: ${company.ruc || ""}`, M, y);
  y += 5;
  doc.text(`Dirección: ${company.address || ""}`, M, y);
  y += 8;

  doc.setFillColor(252, 228, 236);
  doc.setDrawColor(...BRAND);
  doc.roundedRect(M, y, W - 2 * M, 18, 3, 3, "FD");
  const cols = [
    ["N.º de registro", r.code],
    ["Fecha", formatLimaDate(r.created_at)],
    ["Hora", formatLimaTime(r.created_at)],
    ["Estado", r.status_label || ""],
  ];
  const colW = (W - 2 * M) / cols.length;
  cols.forEach(([label, value], i) => {
    const x = M + 6 + i * colW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(label, x, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text(String(value || "—"), x, y + 13.5);
  });
  y += 26;

  const section = (title) => {
    ensure(14);
    doc.setFillColor(...BRAND);
    doc.roundedRect(M, y, W - 2 * M, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), M + 4, y + 5.5);
    y += 12;
  };

  const field = (label, value) => {
    const text = value == null || value === "" ? "—" : String(value);
    const lines = doc.splitTextToSize(text, W - 2 * M - 58);
    ensure(lines.length * 5 + 3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    doc.text(label, M + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    doc.text(lines, M + 58, y);
    y += lines.length * 5 + 3;
  };

  const block = (label, value) => {
    const lines = doc.splitTextToSize(String(value || "—"), W - 2 * M - 4);
    ensure(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    doc.text(label, M + 2, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    lines.forEach((line) => {
      ensure(5);
      doc.text(line, M + 2, y);
      y += 5;
    });
    y += 3;
  };

  section("Información del consumidor");
  field("Nombres", c.names);
  field("Apellido paterno", c.last_name_father);
  field("Apellido materno", c.last_name_mother);
  if (c.is_minor) field("Padre, madre o representante", c.guardian);
  field("Domicilio", c.address);
  field("Tipo de documento", c.doc_type_label);
  field("N.º de documento", c.doc_number);
  field(c.contact_type === "phone" ? "Teléfono" : "Correo electrónico", c.email || c.phone);
  y += 2;

  section("Información del producto");
  field("Tipo de operación", p.operation_type_label);
  field("Producto(s)", p.products);
  field("Monto pagado", p.amount == null ? "—" : `S/ ${Number(p.amount).toFixed(2)}`);
  y += 2;

  section("Detalle del reclamo");
  field("Tipo", d.kind_label);
  block("Descripción de los hechos", d.description);
  block("Solicitud de solución", d.request);

  if (r.response && r.response.text) {
    y += 2;
    section("Respuesta del proveedor");
    if (r.response.updated_at) {
      field("Fecha de respuesta", `${formatLimaDate(r.response.updated_at)} ${formatLimaTime(r.response.updated_at)}`);
    }
    block("Respuesta", r.response.text);
  }

  doc.save(`Reclamo-SIFRAH-${r.code}.pdf`);
}
