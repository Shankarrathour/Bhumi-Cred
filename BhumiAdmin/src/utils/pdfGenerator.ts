import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

/**
 * Captures a DOM element and generates a high-quality A4 PDF.
 * @param elementId The HTML ID of the container to capture.
 * @param fileName Output filename (without extension).
 */
export const generatePathologyPDF = async (elementId: string, fileName: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Internal Error: Unable to find report container.');
    return false;
  }

  const loadToastId = toast.loading('Rendering Medical Report to PDF...');

  try {
    // Use html2canvas to convert DOM to image canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High scale for sharp crisp vector-like text
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimension measurements at 72 dpi
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
    heightLeft -= pageHeight;

    // Add remaining pages if content exceeds A4 length
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(`${fileName}.pdf`);
    
    toast.success('Report PDF generated successfully!', { id: loadToastId });
    return true;
  } catch (error) {
    console.error('PDF Generation failed:', error);
    toast.error('Failed to generate report PDF. Contact support.', { id: loadToastId });
    return false;
  }
};

/**
 * Simulates sharing via WhatsApp or Mail by downloading PDF and initiating Web API links
 */
export const triggerReportShare = async (
  type: 'mail' | 'whatsapp',
  patientName: string,
  patientPhone: string,
  patientEmail?: string,
  bookingCode?: string,
  elementId: string = "clinical-report-document"
) => {
  // First generate the file so user receives local copy
  const cleanFileName = `MedsSeva_Report_${bookingCode || patientName.replace(/\s+/g, '_')}`;
  const pdfSuccess = await generatePathologyPDF(elementId, cleanFileName);
  
  if (!pdfSuccess) return;

  const message = `Hello ${patientName}, your pathology report (${bookingCode || ''}) is now ready and published by MedsSeva Diagnostics. We have generated and sent the PDF copy to your records. Let us know if you require further clinical consultations.`;

  if (type === 'whatsapp') {
    // Clean phone formatting
    const cleanedPhone = patientPhone.replace(/\D/g, '');
    const phoneParam = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(message)}`;
    
    toast.success('Opening WhatsApp Web API securely...', { duration: 2000 });
    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 800);
  } else {
    // Mail link triggers
    const emailTarget = patientEmail || 'patient@medsseva.com';
    const mailUrl = `mailto:${emailTarget}?subject=${encodeURIComponent(`MedsSeva Pathology Report - ${bookingCode || ''}`)}&body=${encodeURIComponent(message)}`;
    
    toast.success('Launching default System Mail composer...', { duration: 2000 });
    setTimeout(() => {
      window.location.href = mailUrl;
    }, 800);
  }
};
