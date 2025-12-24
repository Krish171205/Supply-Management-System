require('dotenv').config();
const sequelize = require('./config/database');
const { Inquiry, InquiryItem, Quotes, QuoteItem, Order, OrderItem } = require('./models');

async function testDB() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync just to be sure (optional, but good for testing)
        // await sequelize.sync({ alter: true }); 

        console.log('Checking Inquiry model...');
        const inquiries = await Inquiry.findAll({ limit: 1 });
        console.log('Inquiries fetch success:', inquiries.length);

        console.log('Checking InquiryItem model...');
        const inquiryItems = await InquiryItem.findAll({ limit: 1 });
        console.log('InquiryItems fetch success:', inquiryItems.length);

        console.log('Checking Quotes model...');
        const quotes = await Quotes.findAll({ limit: 1 });
        console.log('Quotes fetch success:', quotes.length);

        console.log('Checking QuoteItem model...');
        const quoteItems = await QuoteItem.findAll({ limit: 1 });
        console.log('QuoteItems fetch success:', quoteItems.length);

        console.log('Checking Order model...');
        const orders = await Order.findAll({ limit: 1 });
        console.log('Orders fetch success:', orders.length);

        console.log('Checking OrderItem model...');
        const orderItems = await OrderItem.findAll({ limit: 1 });
        console.log('OrderItems fetch success:', orderItems.length);

    } catch (error) {
        console.error('Unable to connect to the database or query models:', error);
    } finally {
        await sequelize.close();
    }
}

testDB();
