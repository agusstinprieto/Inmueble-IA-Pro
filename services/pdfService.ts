
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Property, Agency } from '../types';

/**
 * Service to handle PDF generation for properties and reports.
 * Uses html2canvas to capture DOM elements and jsPDF to save them.
 */
export const pdfService = {

  /**
   * Generates a "Ficha Técnica" (Property Brochure)
   * @param property The property data
   * @param agencyInfo Agency branding and contact info
   */
  async generatePropertySheet(property: Property, agencyInfo: { name: string; color: string; email?: string; phone?: string }) {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = '#050505';
    container.style.color = 'white';
    container.style.fontFamily = 'Inter, system-ui, sans-serif';
    container.style.padding = '40px';

    // Build the HTML structure (Premium style)
    container.innerHTML = `
      <div style="border: 2px solid ${agencyInfo.color}; padding: 30px; border-radius: 40px; position: relative; overflow: hidden;">
        <!-- Header -->
        <div style="display: flex; justify-between: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; margin: 0;">${agencyInfo.name}</h1>
            <p style="color: ${agencyInfo.color}; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">FICHA TÉCNICA EXCLUSIVA</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 14px; font-weight: 900; margin: 0;">${property.operation} - ${property.title}</p>
          </div>
        </div>

        <!-- Hero Image -->
        <div style="width: 100%; height: 400px; border-radius: 30px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <img src="${property.images[0]}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>

        <!-- Info Grid -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">
          <div>
            <h2 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; border-left: 4px solid ${agencyInfo.color}; padding-left: 10px; margin-bottom: 15px;">DESCRIPCIÓN</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #ccc;">${property.description}</p>
            
            <h2 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; border-left: 4px solid ${agencyInfo.color}; padding-left: 10px; margin-top: 30px; margin-bottom: 15px;">AMENIDADES</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${property.amenities.map(a => `<span style="background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 10px; font-size: 10px; font-weight: 700; color: #aaa;">• ${a}</span>`).join('')}
            </div>
          </div>

          <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
            <p style="font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; margin-bottom: 5px;">PRECIO</p>
            <h3 style="font-size: 24px; font-weight: 900; color: white; margin-bottom: 25px;">
              ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: property.currency, maximumFractionDigits: 0 }).format(property.salePrice || property.rentPrice || 0)}
            </h3>

            <!-- Specs -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="font-size: 8px; color: #666; margin: 0;">RECÁMARAS</p>
                <p style="font-size: 14px; font-weight: 900; margin: 0;">${property.specs.bedrooms}</p>
              </div>
              <div>
                <p style="font-size: 8px; color: #666; margin: 0;">BAÑOS</p>
                <p style="font-size: 14px; font-weight: 900; margin: 0;">${property.specs.bathrooms}</p>
              </div>
              <div>
                <p style="font-size: 8px; color: #666; margin: 0;">TERRENO</p>
                <p style="font-size: 14px; font-weight: 900; margin: 0;">${property.specs.m2Total}m²</p>
              </div>
              <div>
                <p style="font-size: 8px; color: #666; margin: 0;">UBICACIÓN</p>
                <p style="font-size: 14px; font-weight: 900; margin: 0;">${property.address.city}</p>
              </div>
            </div>

            <div style="margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px;">
              <p style="font-size: 10px; font-weight: 900; color: #666; margin-bottom: 5px;">COTACTO</p>
              <p style="font-size: 12px; font-weight: 700;">${agencyInfo.phone || ''}</p>
              <p style="font-size: 12px; color: #aaa;">${agencyInfo.email || ''}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#050505',
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);

      const filename = `${agencyInfo.name} - ${property.title}`;
      pdf.setProperties({
        title: filename
      });

      pdf.save(`${filename}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  },

  /**
   * Generates a PDF report from any DOM element identified by ID
   * @param elementId The ID of the element to capture
   * @param filename The name of the resulting file
   */
  async generateReportFromElement(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#050505',
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(elementId);
          if (el) el.style.padding = '40px';
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Error in generateReportFromElement:', err);
    }
  },

  /**
   * Generates a professional PDF report for a property valuation
   * @param result The valuation result from Gemini
   * @param propertyData The search parameters used
   * @param agencyInfo Agency branding
   */
  async generateValuationPDF(
    result: any,
    propertyData: any,
    agencyInfo: { name: string; color: string; email?: string; phone?: string; lang: 'es' | 'en' }
  ) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = '#050505';
    container.style.color = 'white';
    container.style.fontFamily = 'Inter, system-ui, sans-serif';
    container.style.padding = '60px';

    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
        style: 'currency',
        currency: currency.includes('MXN') ? 'MXN' : 'USD',
        maximumFractionDigits: 0
      }).format(amount);
    };

    const isEs = agencyInfo.lang === 'es';

    container.innerHTML = `
      <div style="border: 1px solid rgba(255,255,255,0.1); padding: 40px; border-radius: 40px; background: linear-gradient(135deg, #0a0a0a 0%, #000 100%);">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${agencyInfo.color}; padding-bottom: 20px; margin-bottom: 40px;">
          <div>
            <h1 style="font-size: 28px; font-weight: 900; font-style: italic; text-transform: uppercase; margin: 0;">${agencyInfo.name}</h1>
            <p style="color: ${agencyInfo.color}; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px;">ESTUDIO DE MERCADO CON INTELIGENCIA ARTIFICIAL</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #666; margin: 0;">${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <!-- Main Value -->
        <div style="text-align: center; margin-bottom: 50px; background: rgba(255,255,255,0.02); padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.05);">
          <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #666; letter-spacing: 2px; margin-bottom: 10px;">
            ${isEs ? 'VALOR ESTIMADO DE MERCADO' : 'ESTIMATED MARKET VALUE'}
          </p>
          <h2 style="font-size: 56px; font-weight: 900; font-style: italic; margin: 0; color: white;">
            ${formatCurrency(result.estimatedPrice, result.currency)}
          </h2>
          <p style="font-size: 16px; color: #888; margin-top: 10px;">
            ${isEs ? 'Rango Sugerido' : 'Suggested Range'}: 
            ${formatCurrency(result.priceRange.min, result.currency)} - ${formatCurrency(result.priceRange.max, result.currency)}
          </p>
        </div>

        <!-- Specs Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px;">
          <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; text-align: center;">
            <p style="font-size: 9px; color: #666; text-transform: uppercase; margin-bottom: 5px;">${isEs ? 'PRECIO POR M²' : 'PRICE PER M²'}</p>
            <p style="font-size: 18px; font-weight: 900;">${formatCurrency(result.pricePerM2, result.currency)}</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; text-align: center;">
            <p style="font-size: 9px; color: #666; text-transform: uppercase; margin-bottom: 5px;">${isEs ? 'CONFIANZA IA' : 'AI CONFIDENCE'}</p>
            <p style="font-size: 18px; font-weight: 900; color: #10b981;">${(result.marketConfidence * 100).toFixed(0)}%</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; text-align: center;">
            <p style="font-size: 9px; color: #666; text-transform: uppercase; margin-bottom: 5px;">${isEs ? 'TENDENCIA' : 'TREND'}</p>
            <p style="font-size: 18px; font-weight: 900; color: ${agencyInfo.color};">${result.marketTrend || (isEs ? 'ESTABLE' : 'STABLE')}</p>
          </div>
        </div>

        <!-- Property Details -->
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; border-left: 4px solid ${agencyInfo.color}; padding-left: 12px; margin-bottom: 20px;">
            ${isEs ? 'DETALLES DE LA PROPIEDAD ANALIZADA' : 'PROPERTY DETAILS ANALYZED'}
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: rgba(255,255,255,0.01); padding: 25px; border-radius: 25px;">
             <p style="font-size: 13px; margin: 0; color: #aaa;"><strong style="color: white; font-weight: 900;">${isEs ? 'Tipo' : 'Type'}:</strong> ${propertyData.propertyType}</p>
             <p style="font-size: 13px; margin: 0; color: #aaa;"><strong style="color: white; font-weight: 900;">${isEs ? 'Ubicación' : 'Location'}:</strong> ${propertyData.neighborhood}, ${propertyData.city}</p>
             <p style="font-size: 13px; margin: 0; color: #aaa;"><strong style="color: white; font-weight: 900;">${isEs ? 'Construcción' : 'Built'}:</strong> ${propertyData.m2Built} m²</p>
             <p style="font-size: 13px; margin: 0; color: #aaa;"><strong style="color: white; font-weight: 900;">${isEs ? 'Terreno' : 'Total'}:</strong> ${propertyData.m2Total} m²</p>
             <p style="font-size: 13px; margin: 0; color: #aaa;"><strong style="color: white; font-weight: 900;">${isEs ? 'Habitaciones' : 'Bedrooms'}:</strong> ${propertyData.bedrooms}</p>
             <p style="font-size: 13px; margin: 0; color: #aaa;"><strong style="color: white; font-weight: 900;">${isEs ? 'Baños' : 'Bathrooms'}:</strong> ${propertyData.bathrooms}</p>
          </div>
        </div>

        <!-- AI Insights -->
        <div style="margin-bottom: 40px;">
          <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #666; border-left: 4px solid ${agencyInfo.color}; padding-left: 12px; margin-bottom: 20px;">
            ${isEs ? 'ANÁLISIS Y RECOMENDACIONES ESTRATÉGICAS' : 'STRATEGIC ANALYSIS AND RECOMMENDATIONS'}
          </h3>
          <div style="space-y: 15px;">
            ${result.suggestions.map((s: string) => `
              <div style="margin-bottom: 12px; font-size: 13px; line-height: 1.5; color: #ccc; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 15px;">
                ${s}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 60px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 10px; color: #555;">
            Estudio generado por Inmueble IA Pro Engine
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; font-weight: 900; margin: 0;">${agencyInfo.phone || ''}</p>
            <p style="font-size: 10px; color: #888; margin: 0;">${agencyInfo.email || ''}</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#050505',
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Valuacion_${propertyData.city}_${propertyData.neighborhood}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  }
};
