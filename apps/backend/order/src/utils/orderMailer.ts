import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const isAuthAvailable = !!(config.SMTP_USER && config.SMTP_PASS);
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE || config.SMTP_PORT === 465,
      ...(isAuthAvailable
        ? {
            auth: {
              user: config.SMTP_USER,
              pass: config.SMTP_PASS ? config.SMTP_PASS.replace(/\s+/g, '') : '',
            },
          }
        : {}),
      tls: {
        rejectUnauthorized: config.NODE_ENV === 'production',
      },
    });
  }
  return transporter;
}

function getBaseTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .logo { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .content { padding: 28px 24px; color: #334155; line-height: 1.6; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
    .order-box { background-color: #f1f5f9; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 14px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
    .items-table th { background-color: #f8fafc; text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600; }
    .items-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .summary-table { width: 100%; margin-top: 10px; font-size: 14px; }
    .summary-table td { padding: 4px 0; }
    .btn { display: inline-block; padding: 12px 26px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 8px; margin-top: 16px; text-align: center; }
    .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">TRADENEST</h1>
      <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Online Marketplace & E-Commerce</p>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TRADENEST Inc. Need help? Contact <a href="mailto:support@tradenest.in" style="color:#6366f1;">support@tradenest.in</a>
    </div>
  </div>
</body>
</html>
`;
}

async function sendMailSafe(to: string, subject: string, html: string, text: string) {
  const hasSmtpConfigured = !!(config.SMTP_USER || config.SMTP_HOST !== 'localhost');
  if (!hasSmtpConfigured) {
    logger.info(`[DEV MODE - Mailer] Would send to ${to}: "${subject}"`);
    return { success: true, sentViaSmtp: false };
  }

  try {
    const client = getTransporter();
    const info = await client.sendMail({
      from: {
        name: 'TRADENEST Orders',
        address: config.SMTP_USER || 'noreply@tradenest.local',
      },
      to,
      replyTo: config.SMTP_USER,
      subject,
      text,
      html,
    });
    logger.info(`✅ Order email sent to ${to} (${subject}) - ID: ${info.messageId}`);
    return { success: true, sentViaSmtp: true };
  } catch (err: any) {
    logger.warn(`⚠️ Failed to send order email to ${to}: ${err?.message || err}`);
    return { success: false, sentViaSmtp: false };
  }
}

export async function sendOrderPlacedEmail(
  order: any,
  customer: { email: string; firstName: string; lastName?: string }
) {
  const shortId = order.id.slice(0, 8);
  const name = customer.firstName || 'Valued Customer';
  const total = Number(order.total || 0).toFixed(2);
  const items = order.items || [];
  const deliveryOtp = (order.deliveryOtp || '4821').toString().trim();

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td>${item.title}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${Number(item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const body = `
    <h2 class="title">Thank You For Your Order!</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your order has been placed successfully and has been sent to the merchant for <strong>approval and preparation</strong>.</p>
    
    <div class="order-box">
      <strong>Order ID:</strong> #${shortId}<br/>
      <strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}<br/>
      <strong>Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Pending Seller Approval</span>
    </div>

    <!-- Doorstep Delivery OTP Card -->
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">🔐 Doorstep Delivery Handover OTP</div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #047857; margin: 10px 0;">${deliveryOtp}</div>
      <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
        <strong>Important:</strong> Please keep this 4-digit code confidential. Share it with your TRADENEST delivery driver <strong>only</strong> when you receive your package at your doorstep to verify handover.
      </p>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table class="summary-table">
      <tr>
        <td style="color: #64748b;">Subtotal:</td>
        <td style="text-align: right; font-weight: 600;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">Shipping:</td>
        <td style="text-align: right; font-weight: 600;">₹${Number(order.shipping || 0).toFixed(2)}</td>
      </tr>
      ${Number(order.discount || 0) > 0 ? `
      <tr>
        <td style="color: #10b981;">Discount:</td>
        <td style="text-align: right; font-weight: 600; color: #10b981;">-₹${Number(order.discount).toFixed(2)}</td>
      </tr>` : ''}
      <tr style="border-top: 1px solid #e2e8f0; font-size: 16px;">
        <td style="padding-top: 8px; font-weight: 700;">Total Amount:</td>
        <td style="padding-top: 8px; text-align: right; font-weight: 800; color: #4f46e5;">₹${total}</td>
      </tr>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}" class="btn">View Order Details</a>
    </div>
  `;

  const html = getBaseTemplate(`Order #${shortId} Placed`, body);
  const text = `Hi ${name},\n\nYour order #${shortId} for ₹${total} has been placed successfully.\n\n🔐 YOUR DOORSTEP DELIVERY OTP: ${deliveryOtp}\n(Share this 4-digit code with the delivery partner ONLY upon package handover at your doorstep.)\n\nView details: ${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}`;

  return sendMailSafe(customer.email, `🛒 Order Placed - TRADENEST #${shortId}`, html, text);
}

export async function sendPaymentConfirmedEmail(
  order: any,
  customer: { email: string; firstName: string; lastName?: string },
  payment?: any
) {
  const shortId = order.id.slice(0, 8);
  const name = customer.firstName || 'Valued Customer';
  const total = Number(order.total || 0).toFixed(2);
  const isCod = payment?.provider === 'COD';
  const provider = isCod ? 'Cash on Delivery (COD)' : (payment?.provider || 'Online Payment');
  const providerRef = isCod ? 'Cash upon delivery' : (payment?.providerRef || payment?.id || 'Completed');
  const deliveryOtp = (order.deliveryOtp || '4821').toString().trim();

  const body = `
    <h2 class="title">${isCod ? 'Order Confirmed - Cash on Delivery' : 'Payment Confirmed!'}</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>${isCod ? `Your order <strong>#${shortId}</strong> is confirmed. Please keep exact cash ready upon arrival.` : `We're pleased to confirm that your payment for order <strong>#${shortId}</strong> has been successfully processed.`}</p>

    <div class="order-box" style="background-color: #ecfdf5; border: 1px solid #a7f3d0;">
      <div style="color: #065f46; font-size: 16px; font-weight: 700; margin-bottom: 6px;">${isCod ? 'Pay on Delivery' : 'Payment Successful'}</div>
      <strong>${isCod ? 'Amount to Pay on Delivery:' : 'Amount Paid:'}</strong> ₹${total}<br/>
      <strong>Payment Method:</strong> ${provider}<br/>
      <strong>${isCod ? 'Instructions:' : 'Transaction Reference:'}</strong> ${providerRef}<br/>
      <strong>Status:</strong> Confirmed
    </div>

    <!-- Doorstep Delivery OTP Card -->
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">🔐 Doorstep Delivery Handover OTP</div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #047857; margin: 10px 0;">${deliveryOtp}</div>
      <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
        <strong>Important:</strong> Please keep this 4-digit code safe. You will need to share this OTP with your delivery driver at your doorstep to receive your shipment.
      </p>
    </div>

    <p style="font-size: 14px; color: #475569;">
      The seller has been notified. You will receive an update once the seller approves and ships your items.
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}" class="btn">View Order & Invoice</a>
    </div>
  `;

  const html = getBaseTemplate(`${isCod ? 'Order' : 'Payment'} Confirmed - #${shortId}`, body);
  const text = isCod
    ? `Hi ${name},\n\nYour order #${shortId} for ₹${total} is confirmed via Cash on Delivery.\n\n🔐 YOUR DOORSTEP DELIVERY OTP: ${deliveryOtp}\n(Share this code with the driver ONLY upon handover.)\n\nPlease keep ₹${total} in cash ready upon delivery.\nView details: ${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}`
    : `Hi ${name},\n\nPayment of ₹${total} for order #${shortId} was successful (${provider} ref: ${providerRef}).\n\n🔐 YOUR DOORSTEP DELIVERY OTP: ${deliveryOtp}\n(Share this code with the driver ONLY upon handover.)\n\nView details: ${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}`;

  const subject = isCod 
    ? `💵 Order Confirmed (Cash on Delivery) - TRADENEST #${shortId}` 
    : `💳 Payment Confirmed - TRADENEST Order #${shortId}`;

  return sendMailSafe(customer.email, subject, html, text);
}

export async function sendOrderStatusEmail(
  order: any,
  customer: { email: string; firstName: string; lastName?: string },
  status: string
) {
  const shortId = order.id.slice(0, 8);
  const name = customer.firstName || 'Valued Customer';
  const deliveryOtp = (order.deliveryOtp || '4821').toString().trim();

  let subject = `Order Status Update - TRADENEST #${shortId}`;
  let headline = `Order Status: ${status}`;
  let message = `Your order status has been updated to ${status}.`;
  let badgeColor = '#6366f1';
  let showOtpCard = false;

  if (status === 'CONFIRMED') {
    subject = `✅ Order Approved by Seller - TRADENEST #${shortId}`;
    headline = 'Great News! Your Order Has Been Approved';
    message = `The merchant has reviewed and <strong>approved</strong> your order #${shortId}. Your items are currently being prepared for shipment.`;
    badgeColor = '#10b981';
  } else if (status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY') {
    subject = status === 'OUT_FOR_DELIVERY' 
      ? `🚚 Out for Delivery Today! - TRADENEST #${shortId}` 
      : `🚚 Order Shipped - TRADENEST #${shortId}`;
    headline = status === 'OUT_FOR_DELIVERY' ? 'Your Package is Out for Delivery!' : 'Your Order is on the Way!';
    message = status === 'OUT_FOR_DELIVERY'
      ? `Your delivery partner is en-route with order #${shortId}. Please share your 4-digit Doorstep Delivery OTP with the driver upon arrival.`
      : `Your order #${shortId} has been packed and handed over to our delivery partner. It will reach your doorstep soon.`;
    badgeColor = '#3b82f6';
    showOtpCard = true;
  } else if (status === 'DELIVERED') {
    subject = `📦 Order Delivered - TRADENEST #${shortId}`;
    headline = 'Package Delivered!';
    message = `Your order #${shortId} has been successfully delivered. We hope you enjoy your purchase! If you have any questions or return requests, you can manage them from your orders dashboard.`;
    badgeColor = '#10b981';
  } else if (status === 'CANCELLED') {
    subject = `❌ Order Cancelled - TRADENEST #${shortId}`;
    headline = 'Order Cancelled';
    message = `Your order #${shortId} has been cancelled. If any payment was captured, a full refund will be processed to your source account.`;
    badgeColor = '#ef4444';
  }

  const otpBoxHtml = showOtpCard ? `
    <!-- Doorstep Delivery OTP Card -->
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">🔐 Doorstep Delivery Handover OTP</div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #047857; margin: 10px 0;">${deliveryOtp}</div>
      <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
        <strong>Important:</strong> Please provide this 4-digit code to the delivery driver <strong>only</strong> when you receive your package.
      </p>
    </div>
  ` : '';

  const body = `
    <h2 class="title">${headline}</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>${message}</p>

    <div class="order-box">
      <strong>Order ID:</strong> #${shortId}<br/>
      <strong>Current Status:</strong> <span style="color: ${badgeColor}; font-weight: 700;">${status}</span><br/>
      <strong>Total:</strong> ₹${Number(order.total || 0).toFixed(2)}
    </div>

    ${otpBoxHtml}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}" class="btn">Track Order Details</a>
    </div>
  `;

  const html = getBaseTemplate(subject, body);
  const otpTextSnippet = showOtpCard ? `\n\n🔐 YOUR DOORSTEP DELIVERY OTP: ${deliveryOtp}\n(Share this code with the driver ONLY upon handover)\n` : '';
  const text = `Hi ${name},\n\nOrder #${shortId} update: ${headline}.\nStatus: ${status}.${otpTextSnippet}\nView: ${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}`;

  return sendMailSafe(customer.email, subject, html, text);
}


export async function sendNewOrderReceivedSellerEmail(
  order: any,
  sellerUser: { email: string; firstName?: string; storeName?: string },
  sellerItems: any[]
) {
  const shortId = order.id.slice(0, 8);
  const name = sellerUser.firstName || sellerUser.storeName || 'Seller';
  const total = Number(order.total || 0).toFixed(2);
  const itemsHtml = sellerItems.map((item) => `
    <tr>
      <td><strong>${item.title || item.product?.title || 'Product'}</strong></td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">₹${Number(item.price).toFixed(2)}</td>
    </tr>
  `).join('');

  const body = `
    <h2 class="title">🎉 New Order Received!</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Great news! A customer has placed a new order containing items from your store. Please review the details below and prepare to fulfill it.</p>
    
    <div class="order-box">
      <strong>Order ID:</strong> #${shortId}<br/>
      <strong>Order Status:</strong> <span style="color: #f59e0b; font-weight: 600;">Pending Approval</span><br/>
      <strong>Payment Method:</strong> ${order.payment?.provider || 'Direct'}<br/>
      <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/seller/orders?search=${order.id}" class="btn">View & Approve Order</a>
    </div>
  `;

  const html = getBaseTemplate(`New Order #${shortId} Received`, body);
  const text = `Hi ${name},\n\nYou have received a new order #${shortId} for ₹${total}.\nView & approve it at: ${config.CORS_ORIGIN || 'http://localhost:3000'}/seller/orders?search=${order.id}`;

  return sendMailSafe(sellerUser.email, `🔔 New Order Received - TRADENEST #${shortId}`, html, text);
}

export async function sendReturnRequestSellerEmail(
  order: any,
  sellerUser: { email: string; firstName?: string; storeName?: string },
  reason: string,
  returnItemTitles?: string[]
) {
  const shortId = order.id.slice(0, 8);
  const name = sellerUser.firstName || sellerUser.storeName || 'Seller';
  const body = `
    <h2 class="title" style="color: #9333ea;">🔄 Customer Return Request Received</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>A customer has submitted a return request for Order #${shortId}. Please inspect the reason below and take action on your Seller Orders dashboard.</p>
    
    <div class="order-box">
      <strong>Order ID:</strong> #${shortId}<br/>
      <strong>Return Reason:</strong> <span style="color: #9333ea; font-weight: 600;">${reason}</span><br/>
      ${returnItemTitles && returnItemTitles.length > 0 ? `<strong>Item(s):</strong> ${returnItemTitles.join(', ')}<br/>` : ''}
      <strong>Customer:</strong> ${order.shippingAddress?.fullName || 'Customer'}<br/>
      <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/seller/orders?status=RETURN_REQUESTED" class="btn" style="background-color: #9333ea;">Review Return Request</a>
    </div>
  `;

  const html = getBaseTemplate(`Return Request for Order #${shortId}`, body);
  const text = `Hi ${name},\n\nA return request was submitted for Order #${shortId}.\nReason: ${reason}\nReview it at: ${config.CORS_ORIGIN || 'http://localhost:3000'}/seller/orders?status=RETURN_REQUESTED`;

  return sendMailSafe(sellerUser.email, `⚠️ Return Request - TRADENEST #${shortId}`, html, text);
}

export async function sendReturnDecisionCustomerEmail(
  order: any,
  customer: { email: string; firstName: string; lastName?: string },
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
) {
  const shortId = order.id.slice(0, 8);
  const name = `${customer.firstName} ${customer.lastName || ''}`.trim() || 'Customer';
  const isApproved = status === 'APPROVED';

  const body = `
    <h2 class="title" style="color: ${isApproved ? '#059669' : '#dc2626'};">
      ${isApproved ? '✅ Return Request Approved!' : '❌ Return Request Update'}
    </h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>${isApproved
      ? `Your return request for Order #${shortId} has been <strong>approved</strong> by the seller. Our logistics fleet has scheduled reverse pickup for your parcel.`
      : `Your return request for Order #${shortId} was reviewed and could not be approved at this time.`
    }</p>
    
    <div class="order-box">
      <strong>Order ID:</strong> #${shortId}<br/>
      <strong>Return Status:</strong> <span style="color: ${isApproved ? '#059669' : '#dc2626'}; font-weight: 600;">${isApproved ? 'Approved & Pickup Scheduled' : 'Rejected'}</span><br/>
      ${!isApproved && rejectionReason ? `<strong>Reason:</strong> ${rejectionReason}<br/>` : ''}
      <strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}" class="btn">View Order Details</a>
    </div>
  `;

  const html = getBaseTemplate(`Return Update for Order #${shortId}`, body);
  const text = `Hi ${name},\n\nYour return request for Order #${shortId} is ${isApproved ? 'APPROVED' : 'REJECTED'}.\nView details at: ${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id}`;

  return sendMailSafe(customer.email, `${isApproved ? '✅' : '❌'} Return Request Update - TRADENEST #${shortId}`, html, text);
}

export async function sendDoorstepOtpEmail(
  order: any,
  customer: { email: string; firstName: string; lastName?: string },
  newOtp: string,
  type: 'DELIVERY' | 'RETURN_PICKUP',
  driver?: { name?: string; phone?: string; vehicle?: string }
) {
  const shortId = order.id ? order.id.slice(0, 8) : (order.orderNumber || 'TN-ORD');
  const name = `${customer.firstName} ${customer.lastName || ''}`.trim() || 'Customer';
  const isReturn = type === 'RETURN_PICKUP';

  const subject = isReturn
    ? `🔐 Fresh Return Handover OTP: ${newOtp} - Order #${shortId}`
    : `🔐 Fresh Doorstep Delivery OTP: ${newOtp} - Order #${shortId}`;

  const body = `
    <h2 class="title" style="color: ${isReturn ? '#9333ea' : '#059669'};">
      ${isReturn ? '🔄 Return Pickup Verification' : '🚚 Doorstep Delivery Verification'}
    </h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>${isReturn
      ? `Your TRADENEST delivery partner is at your doorstep to pick up the return parcel for Order #${shortId}.`
      : `Your TRADENEST delivery partner is at your doorstep with your package for Order #${shortId}.`
    }</p>
    
    <!-- Big OTP Card -->
    <div style="background: linear-gradient(135deg, ${isReturn ? '#faf5ff' : '#ecfdf5'} 0%, ${isReturn ? '#f3e8ff' : '#f0fdf4'} 100%); border: 2px dashed ${isReturn ? '#9333ea' : '#059669'}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 13px; font-weight: 700; color: ${isReturn ? '#6b21a8' : '#065f46'}; text-transform: uppercase; letter-spacing: 1.5px;">
        ${isReturn ? 'Fresh Return Handover OTP' : 'Fresh Doorstep Delivery OTP'}
      </div>
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: ${isReturn ? '#7e22ce' : '#047857'}; margin: 12px 0;">
        ${newOtp}
      </div>
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #dc2626; line-height: 1.5;">
        ⚠️ Note: Any old OTP is now expired and no longer valid.
      </p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: ${isReturn ? '#581c87' : '#065f46'}; line-height: 1.5;">
        ${isReturn
          ? 'Share this 4-digit code with the courier ONLY after you hand over the return package.'
          : 'Share this 4-digit code with your courier partner ONLY after receiving your package.'
        }
      </p>
    </div>

    ${driver?.name ? `
    <div class="order-box">
      <strong>Delivery Partner:</strong> ${driver.name} (${driver.vehicle || 'Vehicle'})<br/>
      ${driver.phone ? `<strong>Contact:</strong> ${driver.phone}<br/>` : ''}
      <strong>Time Requested:</strong> ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${config.CORS_ORIGIN || 'http://localhost:3000'}/orders/${order.id || ''}" class="btn" style="background-color: ${isReturn ? '#9333ea' : '#059669'};">View Live Tracking</a>
    </div>
  `;

  const html = getBaseTemplate(subject, body);
  const text = `Hi ${name},\n\nYour delivery partner is at your doorstep.\n${isReturn ? 'RETURN HANDOVER OTP' : 'DOORSTEP DELIVERY OTP'}: ${newOtp}\n⚠️ Note: Any old OTP is no longer valid.\nShare this with the driver only upon parcel handover.\nOrder: #${shortId}`;

  return sendMailSafe(customer.email, subject, html, text);
}
