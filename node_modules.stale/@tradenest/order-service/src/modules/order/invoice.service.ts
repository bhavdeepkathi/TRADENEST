import PDFDocument from 'pdfkit';

interface InvoiceData {
  id: string;
  number: string;
  createdAt: Date | string;
}

interface AddressData {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export function generateInvoicePdf(order: any, invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Brand Header
      doc.rect(0, 0, 595.28, 80).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('TRADENEST', 40, 25);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Multi-Vendor Commerce Platform', 40, 50);

      doc.fillColor('#38bdf8').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 400, 25, { align: 'right' });
      doc.fillColor('#cbd5e1').fontSize(9).font('Helvetica').text(`Invoice #: ${invoice.number}`, 400, 45, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 400, 58, { align: 'right' });

      // Order Reference Banner
      let y = 95;
      doc.rect(40, y, 515, 30).fill('#f1f5f9');
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text('Order ID:', 50, y + 10);
      doc.font('Helvetica').text(order.id, 95, y + 10);
      doc.font('Helvetica-Bold').text('Order Date:', 260, y + 10);
      doc.font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-IN'), 320, y + 10);
      doc.font('Helvetica-Bold').text('Payment:', 430, y + 10);
      const payText = order.payment?.provider === 'COD' ? (order.payment.status === 'SUCCESS' ? 'COD (Paid)' : 'COD (Due on Delivery)') : (order.payment?.provider ? `${order.payment.provider} (${order.payment.status})` : 'PAID');
      doc.font('Helvetica').text(payText, 480, y + 10);

      // Shipping & Billing Details
      y = 140;
      let shipping: AddressData = {};
      try {
        shipping = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
      } catch {
        shipping = {};
      }

      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Bill & Ship To:', 40, y);
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      let addrY = y + 16;
      if (shipping.name) {
        doc.text(shipping.name, 40, addrY);
        addrY += 12;
      }
      if (shipping.line1) {
        doc.text(shipping.line1, 40, addrY);
        addrY += 12;
      }
      if (shipping.line2) {
        doc.text(shipping.line2, 40, addrY);
        addrY += 12;
      }
      const cityState = [shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(', ');
      if (cityState) {
        doc.text(cityState, 40, addrY);
        addrY += 12;
      }
      doc.text(shipping.country || 'India', 40, addrY);
      if (shipping.phone) {
        addrY += 12;
        doc.text(`Phone: ${shipping.phone}`, 40, addrY);
      }

      // Seller / Platform Details (right side)
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Sold By / Platform:', 340, y);
      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text('TradeNest Online Services Pvt Ltd', 340, y + 16);
      doc.text('GSTIN: 29AABCU9603R1Z7', 340, y + 28);
      doc.text('Support: support@tradenest.local', 340, y + 40);
      doc.text('Website: tradenest.local', 340, y + 52);

      // Items Table Header
      y = Math.max(addrY + 25, 225);
      doc.rect(40, y, 515, 22).fill('#0284c7');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('#', 48, y + 6);
      doc.text('Item Description', 70, y + 6);
      doc.text('Qty', 320, y + 6, { align: 'center', width: 35 });
      doc.text('Price (INR)', 365, y + 6, { align: 'right', width: 75 });
      doc.text('Total (INR)', 450, y + 6, { align: 'right', width: 95 });

      y += 24;
      doc.font('Helvetica').fontSize(9);

      (order.items || []).forEach((item: any, index: number) => {
        const itemPrice = Number(item.price || 0);
        const itemDiscount = Number(item.discount || 0);
        const lineTotal = itemPrice * item.quantity - itemDiscount;

        const rowBg = index % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, y, 515, 22).fill(rowBg);

        doc.fillColor('#334155');
        doc.text(String(index + 1), 48, y + 6);
        doc.text(item.title || 'Product Item', 70, y + 6, { width: 245, ellipsis: true });
        doc.text(String(item.quantity), 320, y + 6, { align: 'center', width: 35 });
        doc.text(itemPrice.toFixed(2), 365, y + 6, { align: 'right', width: 75 });
        doc.text(lineTotal.toFixed(2), 450, y + 6, { align: 'right', width: 95 });

        y += 22;
      });

      // Horizontal separator
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      y += 12;

      // Summary Totals
      const subtotal = Number(order.subtotal || 0);
      const discount = Number(order.discount || 0);
      const shippingFee = Number(order.shipping || 0);
      const tax = Number(order.tax || 0);
      const total = Number(order.total || 0);

      const labelX = 360;
      const valX = 450;
      const colWidth = 95;

      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text('Subtotal:', labelX, y, { align: 'right', width: 80 });
      doc.text(subtotal.toFixed(2), valX, y, { align: 'right', width: colWidth });
      y += 16;

      if (discount > 0) {
        doc.fillColor('#16a34a');
        doc.text('Discount:', labelX, y, { align: 'right', width: 80 });
        doc.text(`-${discount.toFixed(2)}`, valX, y, { align: 'right', width: colWidth });
        y += 16;
      }

      doc.fillColor('#475569');
      doc.text('Shipping:', labelX, y, { align: 'right', width: 80 });
      doc.text(shippingFee.toFixed(2), valX, y, { align: 'right', width: colWidth });
      y += 16;

      doc.text('GST / Tax (18%):', labelX, y, { align: 'right', width: 80 });
      doc.text(tax.toFixed(2), valX, y, { align: 'right', width: colWidth });
      y += 20;

      // Grand Total Highlight
      doc.rect(340, y - 4, 215, 26).fill('#f0fdf4');
      doc.rect(340, y - 4, 215, 26).strokeColor('#86efac').lineWidth(1).stroke();
      doc.fillColor('#15803d').fontSize(11).font('Helvetica-Bold');
      doc.text('Grand Total (INR):', 345, y + 4);
      doc.text(`Rs. ${total.toFixed(2)}`, valX, y + 4, { align: 'right', width: colWidth });

      // Footer
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
        .text('This is a computer-generated tax invoice. No signature required.', 40, footerY + 8, { align: 'center', width: 515 })
        .text('For returns, refunds, or support, please visit tradenest.local/profile or contact support.', 40, footerY + 20, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
