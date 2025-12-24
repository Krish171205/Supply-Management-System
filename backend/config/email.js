// Simple email utility using nodemailer
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'krishbavishi2005@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'yourpassword' // Use env for real deployment
  }
});

function sendTestEmail(to, details = {}) {
  // Handle array of emails or comma-separated string
  let recipients = to;
  if (Array.isArray(to)) {
    recipients = to.join(', ');
  }

  console.log('Attempting to send email to:', recipients);
  console.log('Using Gmail user:', process.env.EMAIL_PASSWORD ? 'env password set' : 'no password');
  let text = 'email test';
  if (details.type === 'supplier') {
    text = `Welcome to Krisba!\nYour supplier account has been created.\nUsername: ${details.username}\nPassword: ${details.password}`;
  } else if (details.type === 'inquiry') {
    text = `You have a new inquiry.\nIngredient: ${details.ingredient_name}\nBrands: ${details.brands || 'Any'}\nQuantity: ${details.quantity} ${details.unit || ''}\nNotes: ${details.notes || 'None'}`;
  } else if (details.type === 'inquiry_multi') {
    const itemsList = details.items.map(item =>
      `- ${item.name} (${item.quantity} ${item.unit || ''}) [Brands: ${item.brands}]`
    ).join('\n');
    text = `You have a new inquiry with multiple items:\n\n${itemsList}\n\nNotes: ${details.notes || 'None'}`;
  } else if (details.type === 'order') {
    text = `You have a new order.\nIngredient: ${details.ingredient_name}\nBrands: ${details.brands || 'Any'}\nPrice: ${details.price} per ${details.unit || 'unit'}\nQuantity: ${details.quantity} ${details.unit || ''}\nTotal: ${details.total}`;
  } else if (details.type === 'order_multi') {
    const itemsList = details.items.map(item =>
      `- ${item.ingredient_name} (${item.brand}) | Qty: ${item.quantity} ${item.unit} | Price: ${item.price} | Total: ${item.total}`
    ).join('\n');
    text = `You have a new order (Order #${details.orderId}) with multiple items:\n\n${itemsList}\n\nTotal Order Value: ${details.grandTotal}\n\nPlease ship these items soon.`;
  }
  return transporter.sendMail({
    from: 'krishbavishi2005@gmail.com',
    to: recipients,
    subject: 'Krisba Notification',
    text
  }).then(info => {
    console.log('Email sent:', info);
    return info;
  }).catch(err => {
    console.error('Email send error:', err);
    throw err;
  });
}

module.exports = { sendTestEmail };
