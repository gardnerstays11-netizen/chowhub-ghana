interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
  console.log(`[EMAIL] Body preview: ${options.html.replace(/<[^>]*>/g, '').substring(0, 200)}...`);
  return true;
}

export function orderConfirmationEmail(data: {
  customerName: string;
  orderType: string;
  listingName: string;
  items: Array<{ name: string; quantity: number; price?: number }>;
  totalAmount?: number;
  paymentMethod: string;
}) {
  const itemRows = data.items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.quantity}x ${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${i.price ? `GHS ${(i.price * i.quantity).toFixed(2)}` : '-'}</td></tr>`
  ).join('');

  return {
    subject: `Order Confirmed — ${data.listingName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#24503a;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">ChowHub Ghana</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#24503a;margin-top:0;">Order Confirmed!</h2>
          <p>Hi ${data.customerName},</p>
          <p>Your ${data.orderType.replace('_', ' ')} order from <strong>${data.listingName}</strong> has been received.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead><tr><th style="padding:8px;border-bottom:2px solid #24503a;text-align:left;">Item</th><th style="padding:8px;border-bottom:2px solid #24503a;text-align:right;">Price</th></tr></thead>
            <tbody>${itemRows}</tbody>
            ${data.totalAmount ? `<tfoot><tr><td style="padding:8px;font-weight:bold;">Total</td><td style="padding:8px;font-weight:bold;text-align:right;">GHS ${data.totalAmount.toFixed(2)}</td></tr></tfoot>` : ''}
          </table>
          <p><strong>Payment:</strong> ${data.paymentMethod === 'whatsapp' ? 'Pay on arrival (WhatsApp order)' : 'Paid online via Paystack'}</p>
          <p style="color:#666;font-size:13px;">Thank you for using ChowHub! If you have questions, contact the restaurant directly.</p>
        </div>
        <div style="background:#f7f5f1;padding:16px;text-align:center;font-size:12px;color:#888;">
          ChowHub Ghana — Discover the best food in Ghana
        </div>
      </div>
    `,
  };
}

export function reservationConfirmationEmail(data: {
  customerName: string;
  listingName: string;
  date: string;
  time: string;
  partySize: number;
  occasion?: string;
}) {
  return {
    subject: `Reservation Confirmed — ${data.listingName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#24503a;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">ChowHub Ghana</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#24503a;margin-top:0;">Reservation Confirmed!</h2>
          <p>Hi ${data.customerName},</p>
          <p>Your table has been reserved at <strong>${data.listingName}</strong>.</p>
          <div style="background:#f7f5f1;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:4px 0;"><strong>Date:</strong> ${data.date}</p>
            <p style="margin:4px 0;"><strong>Time:</strong> ${data.time}</p>
            <p style="margin:4px 0;"><strong>Party Size:</strong> ${data.partySize} ${data.partySize === 1 ? 'guest' : 'guests'}</p>
            ${data.occasion ? `<p style="margin:4px 0;"><strong>Occasion:</strong> ${data.occasion}</p>` : ''}
          </div>
          <p style="color:#666;font-size:13px;">Please arrive on time. Contact the restaurant if you need to modify your reservation.</p>
        </div>
        <div style="background:#f7f5f1;padding:16px;text-align:center;font-size:12px;color:#888;">
          ChowHub Ghana — Discover the best food in Ghana
        </div>
      </div>
    `,
  };
}

export function passwordResetEmail(data: {
  name: string;
  resetUrl: string;
}) {
  return {
    subject: 'Reset Your Password — ChowHub Ghana',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#24503a;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">ChowHub Ghana</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#24503a;margin-top:0;">Password Reset Request</h2>
          <p>Hi ${data.name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${data.resetUrl}" style="display:inline-block;background:#24503a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
          </div>
          <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background:#f7f5f1;padding:16px;text-align:center;font-size:12px;color:#888;">
          ChowHub Ghana — Discover the best food in Ghana
        </div>
      </div>
    `,
  };
}

export function orderStatusUpdateEmail(data: {
  customerName: string;
  listingName: string;
  orderId: string;
  newStatus: string;
}) {
  const statusText: Record<string, string> = {
    confirmed: 'has been confirmed by the restaurant',
    preparing: 'is now being prepared',
    ready: 'is ready for pickup/delivery',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
  };

  return {
    subject: `Order ${data.newStatus.charAt(0).toUpperCase() + data.newStatus.slice(1)} — ${data.listingName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#24503a;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">ChowHub Ghana</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#24503a;margin-top:0;">Order Update</h2>
          <p>Hi ${data.customerName},</p>
          <p>Your order from <strong>${data.listingName}</strong> ${statusText[data.newStatus] || `status changed to: ${data.newStatus}`}.</p>
          <p style="color:#666;font-size:13px;">Thank you for using ChowHub!</p>
        </div>
        <div style="background:#f7f5f1;padding:16px;text-align:center;font-size:12px;color:#888;">
          ChowHub Ghana — Discover the best food in Ghana
        </div>
      </div>
    `,
  };
}
