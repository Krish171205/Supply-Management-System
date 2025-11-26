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
  console.log('Attempting to send email to:', to);
  console.log('Using Gmail user:', process.env.EMAIL_PASSWORD ? 'env password set' : 'no password');
  let text = 'email test';
  if (details.type === 'supplier') {
    text = `Welcome to Krisba!\nYour supplier account has been created.\nUsername: ${details.username}\nPassword: ${details.password}`;
  } else if (details.type === 'inquiry') {
    text = `You have a new inquiry.\nIngredient: ${details.ingredient_name}\nNotes: ${details.notes || 'None'}`;
  } else if (details.type === 'order') {
    text = `You have a new order.\nIngredient: ${details.ingredient_name}\nPrice: ${details.price}\nQuantity: ${details.quantity}\nTotal: ${details.total}`;
  }
  return transporter.sendMail({
    from: 'krishbavishi2005@gmail.com',
    to,
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
