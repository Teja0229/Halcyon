const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');


const MONGO_URL = 'mongodb://127.0.0.1:27017/Halcoyn';

main().then(() => {
    console.log('Connected to DB');
}).catch((err) => {
    console.error(err);
});

async function main() { 
    await mongoose.connect(MONGO_URL);
    
}
 

const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log('Database initialized data');


};

initDB();