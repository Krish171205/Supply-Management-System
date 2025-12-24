
require('dotenv').config();
const { Ingredient } = require('./models');

async function checkUnits() {
    try {
        const ingredients = await Ingredient.findAll();
        console.log('--- Ingredient Units ---');
        ingredients.forEach(i => {
            console.log(`${i.name}: ${i.unit} (Brands: ${JSON.stringify(i.brands)})`);
        });
        console.log('------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUnits();
