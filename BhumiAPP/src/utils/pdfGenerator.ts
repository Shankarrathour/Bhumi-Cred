import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LabReport } from '../mock/reportMockData';
import { COLORS } from '../theme/theme';

export const generateReportHTML = (report: LabReport): string => {
  const deepGreen = COLORS.primary;
  const lightGreen = COLORS.background;

  // Generate table rows for the HTML
  const renderRows = () => {
    return report.sections.map(sec => {
      const categoryHeader = `
        <tr>
          <td colspan="4" style="background-color: #f0fdf4; font-weight: 800; font-size: 12px; padding: 10px; text-align: center; border-bottom: 2px solid ${deepGreen}; color: ${deepGreen}; font-family: sans-serif; letter-spacing: 1px;">
            ${sec.category}
          </td>
        </tr>
        <tr>
          <td colspan="4" style="font-weight: 700; font-size: 13px; padding: 10px 4px; text-align: center; color: #1e293b; text-transform: uppercase;">
            ${report.testName}
          </td>
        </tr>
      `;

      const paramRows = sec.parameters.map(param => {
        const isFlagged = param.flag ? true : false;
        const valStyle = isFlagged ? 'font-weight: 800; color: #b45309;' : 'font-weight: 600; color: #0f172a;';
        const flagSpan = param.flag ? `<span style="display:inline-block; font-weight:900; color:#b45309; margin-right: 4px;">(${param.flag})</span>` : '';
        
        return `
          <tr style="border-bottom: 1px solid #d1fae5; font-size: 11px;">
            <td style="padding: 10px 6px; text-align: left; font-weight: 600; color: #334155;">${param.name}</td>
            <td style="padding: 10px 6px; text-align: center; ${valStyle}">
              <div style="display: flex; justify-content: center; align-items: center; gap: 2px;">
                ${flagSpan}
                <span>${param.value}</span>
              </div>
            </td>
            <td style="padding: 10px 6px; text-align: center; color: #475569;">${param.unit}</td>
            <td style="padding: 10px 6px; text-align: center; color: #475569; font-weight: 500;">${param.referenceRange}</td>
          </tr>
        `;
      }).join('');

      return categoryHeader + paramRows;
    }).join('');
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Helvetica Neue', 'Arial', sans-serif; }
          body { padding: 0; background-color: #ffffff; }
          .container { width: 100%; padding: 30px; }
          
          /* Top letterhead bar */
          .letterhead {
            background-color: ${deepGreen};
            color: #ffffff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 30px;
            border-bottom: 4px solid #022c22;
          }
          .logo-section { display: flex; align-items: center; }
          .logo-icon {
            font-size: 28px;
            margin-right: 12px;
            border: 2px solid white;
            border-radius: 8px;
            padding: 4px 8px;
            background-color: rgba(255, 255, 255, 0.1);
          }
          .brand-info h1 { font-size: 20px; margin: 0; letter-spacing: 0.5px; font-weight: 800; }
          .brand-info p { font-size: 11px; opacity: 0.9; margin-top: 2px; letter-spacing: 0.3px; }
          .contact-info { text-align: right; font-size: 11px; line-height: 1.6; }
          
          /* Registration & RegNo metadata block */
          .meta-header {
            padding: 16px 30px;
            border-bottom: 1.5px solid #a7f3d0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            background-color: #f9fbf9;
          }
          .farmer-meta h3 { font-size: 16px; color: #0f172a; margin-bottom: 6px; font-weight: 800; }
          .farmer-meta table { font-size: 11px; border-collapse: collapse; }
          .farmer-meta td { padding: 3px 0; text-align: left; }
          .farmer-meta .lbl { color: #475569; font-weight: 600; padding-right: 10px; min-width: 90px; }
          .farmer-meta .val { color: #0f172a; font-weight: 700; }
          
          .barcode-section {
            text-align: right;
            font-size: 10px;
            color: #1e293b;
          }
          .barcode-visual {
            letter-spacing: 1px;
            font-family: monospace;
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 4px;
            color: #475569;
          }
          .dates-table {
            margin-top: 6px;
            font-size: 10px;
            border-collapse: collapse;
          }
          .dates-table td { padding: 3px 0; text-align: left; }
          .dates-table .lbl { color: #475569; min-width: 110px; }
          .dates-table .val { color: #0f172a; font-weight: 700; text-align: right; padding-left: 8px; }
          
          /* Results Grid Table */
          .results-section {
            padding: 24px 30px;
          }
          .results-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid ${deepGreen};
          }
          .results-table th {
            background-color: ${deepGreen};
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 10px 6px;
            border-bottom: 2px solid ${deepGreen};
            letter-spacing: 0.5px;
          }
          
          /* Auditor notes box */
          .notes-section {
            padding: 10px 30px;
          }
          .notes-box {
            background-color: #f0fdf4;
            border: 1px dashed #6ee7b7;
            border-radius: 8px;
            padding: 14px;
          }
          .notes-box h4 { font-size: 12px; font-weight: 800; color: #064e3b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .notes-box p { font-size: 10.5px; color: #0f5132; line-height: 1.6; font-style: italic; }
          
          /* Signatures section */
          .signatures-container {
            padding: 40px 30px 24px 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signature-block {
            text-align: center;
            width: 185px;
          }
          .sig-line {
            width: 100%;
            border-top: 1.5px solid #a7f3d0;
            margin-bottom: 8px;
          }
          .sig-font {
            font-family: 'Brush Script MT', cursive, sans-serif;
            font-size: 24px;
            color: #047857;
            margin-bottom: 4px;
            font-style: italic;
          }
          .sig-block h5 { font-size: 11px; font-weight: 800; color: #0f172a; }
          .sig-block p { font-size: 9px; color: #475569; margin-top: 2px; }
 
          /* Legal Disclaimer Footer */
          .footer {
            margin-top: 30px;
            padding: 24px 30px;
            text-align: center;
            border-top: 1.5px solid #d1fae5;
            background-color: #fcfdfc;
          }
          .legal-notic {
            font-size: 11px;
            font-weight: 800;
            color: #064e3b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .timings { font-size: 10px; color: #475569; margin-bottom: 8px; }
          .disclaimer { font-size: 9px; color: #475569; line-height: 1.5; font-style: normal; }
        </style>
      </head>
      <body>
        <!-- Header letterhead bar -->
        <div class="letterhead">
          <div class="logo-section">
            <div class="logo-icon">🌱</div>
            <div class="brand-info">
              <h1>BhumiCred Soil & Carbon Labs</h1>
              <p>Verified Agricultural MRV & Soil Carbon Registry</p>
            </div>
          </div>
          <div class="contact-info">
            <div>📞 +91 98765 43210</div>
            <div>✉️ audits@bhumicred.org</div>
            <div>🌐 www.bhumicred.org</div>
          </div>
        </div>
 
        <!-- Farmer Meta Headers -->
        <div class="meta-header">
          <div class="farmer-meta">
            <h3>${report.farmerName}</h3>
            <table>
              <tr>
                <td class="lbl">Acreage/Loc</td>
                <td class="val">: ${report.ageSex}</td>
              </tr>
              <tr>
                <td class="lbl">Verified by</td>
                <td class="val">: ${report.referredBy}</td>
              </tr>
              <tr>
                <td class="lbl">Plot ID</td>
                <td class="val">: ${report.regNo}</td>
              </tr>
            </table>
          </div>
          <div class="barcode-section">
            <div class="barcode-visual">||||| || || |||| ||| | || ${report.regNo}</div>
            <table class="dates-table">
              <tr><td class="lbl">Plot Registered</td><td class="val">: ${report.registeredOn}</td></tr>
              <tr><td class="lbl">Inspection Date</td><td class="val">: ${report.collectedOn}</td></tr>
              <tr><td class="lbl">Baseline Lock</td><td class="val">: ${report.receivedOn}</td></tr>
              <tr><td class="lbl">Credit Issued</td><td class="val">: ${report.reportedOn}</td></tr>
            </table>
          </div>
        </div>
 
        <!-- Main results section -->
        <div class="results-section">
          <table class="results-table">
            <thead>
              <tr>
                <th style="width: 40%; text-align: left; padding-left: 8px;">METRIC DESCRIPTION</th>
                <th style="width: 20%; text-align: center;">VALUE</th>
                <th style="width: 20%; text-align: center;">UNIT</th>
                <th style="width: 20%; text-align: center;">TARGET RANGE</th>
              </tr>
            </thead>
            <tbody>
              ${renderRows()}
            </tbody>
          </table>
        </div>
 
        <!-- Auditor Notes -->
        <div class="notes-section">
          <div class="notes-box">
            <h4>Auditor Recommendations & Notes:</h4>
            <p>${report.auditorNotes}</p>
          </div>
        </div>
 
        <!-- Signatures -->
        <div class="signatures-container">
          <div class="signature-block">
            <div class="sig-font">S. Sharma</div>
            <div class="sig-line"></div>
            <h5>Sachin Sharma</h5>
            <p>GIS Lead Auditor, BhumiCred</p>
          </div>
          <div class="signature-block">
            <div class="sig-font">Dr. A.K. Asthana</div>
            <div class="sig-line"></div>
            <h5>Dr. A. K. Asthana</h5>
            <p>Senior Soil Scientist, ICAR</p>
          </div>
        </div>
 
        <!-- Footer legal section -->
        <div class="footer">
          <div class="legal-notic">CERTIFIED CARBON MRV BLOCKCHAIN REPORT</div>
          <div class="timings">Registry status: ACTIVE · Secured with IPFS hash verification</div>
          <div class="disclaimer">
            BhumiCred Carbon Credits are verified using remote sensing satellite imagery combined with accredited on-field soil core samples. For questions or to list credits on public carbon registries, contact registry@bhumicred.org.
          </div>
        </div>
      </body>
    </html>
  `;
};
 
export const downloadAndShareReportPDF = async (report: LabReport, onLoadingChange?: (loading: boolean) => void) => {
  try {
    if (onLoadingChange) onLoadingChange(true);
    
    const html = generateReportHTML(report);
    
    // Convert to PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });
    
    // Trigger Native Share/Save dialog
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Download Carbon Audit Certificate - ${report.testName}`,
      UTI: 'com.adobe.pdf'
    });
    
  } catch (error) {
    console.error('Error generating/sharing PDF:', error);
  } finally {
    if (onLoadingChange) onLoadingChange(false);
  }
};
