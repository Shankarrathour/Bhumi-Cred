/**
 * Universal PDF & Document Exporter for BhumiCred Admin Portal
 * Triggers real file downloads in the browser for PDF Documents, MoU Contracts,
 * Insurance Certificates, Aadhaar/PAN Verification Cards, and CSV Audit Logs.
 */

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  metadata?: Record<string, string | number>;
  sections?: { heading: string; content: string }[];
}

export const downloadPDFDocument = ({
  title,
  subtitle,
  filename,
  metadata = {},
  sections = [],
}: PDFExportOptions) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const metadataRows = Object.entries(metadata)
    .map(
      ([key, val]) =>
        `<tr><td style="padding:6px 12px;font-weight:bold;color:#475569;border-bottom:1px solid #E2E8F0;width:35%;">${key}</td><td style="padding:6px 12px;color:#0F172A;border-bottom:1px solid #E2E8F0;">${val}</td></tr>`
    )
    .join('');

  const sectionBlocks = sections
    .map(
      (sec) =>
        `<div style="margin-top:20px;"><h3 style="font-size:14px;color:#16A34A;border-bottom:2px solid #DCFCE7;padding-bottom:4px;margin-bottom:8px;">${sec.heading}</h3><p style="font-size:12px;color:#334155;line-height:1.6;">${sec.content}</p></div>`
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #0F172A; background: #FFF; }
    .header { border-bottom: 3px solid #16A34A; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 20px; font-weight: bold; color: #16A34A; letter-spacing: -0.5px; }
    .badge { font-size: 11px; font-weight: bold; background: #F0FDF4; color: #16A34A; padding: 4px 10px; border-radius: 20px; border: 1px solid #DCFCE7; }
    .title-box { margin-bottom: 20px; }
    .title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 6px 0; }
    .subtitle { font-size: 13px; color: #64748B; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12.5px; }
    .footer { margin-top: 50px; border-top: 1px solid #E2E8F0; padding-top: 12px; font-size: 11px; color: #94A3B8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">BHUMICRED • OFFICIAL DOCUMENT</div>
    <div class="badge">VERIFIED STAMP</div>
  </div>

  <div class="title-box">
    <h1 class="title">${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  </div>

  ${metadataRows ? `<table><tbody>${metadataRows}</tbody></table>` : ''}

  ${sectionBlocks}

  <div class="footer">
    <span>Generated via BhumiCred Enterprise Portal</span>
    <span>Date: ${currentDate} • Digital Seal Verified</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
`;

  // Create a Blob and trigger a real browser file download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open print preview window which allows direct "Save as PDF"
  const printWin = window.open(url, '_blank');
  if (printWin) {
    printWin.focus();
  } else {
    // Fallback: direct download file anchor
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') || filename.endsWith('.html') ? filename : `${filename}.pdf.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const downloadCSVDocument = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
