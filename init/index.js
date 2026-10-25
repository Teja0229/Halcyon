const path = require('path');
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
}
const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/Halcoyn';

main().then(async () => {
    console.log('Connected to DB:', dbUrl.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');
    await initDB();
    mongoose.connection.close();
}).catch((err) => {
    console.error("Database connection error:", err);
});

async function main() { 
    await mongoose.connect(dbUrl);
}
 

const Review = require('../models/review.js');

const sampleReviewsPool = [
    { comment: "Absolutely breathtaking experience! The place was spotless, beautifully designed, and the views were mesmerizing.", rating: 5 },
    { comment: "Had an incredible weekend getaway here. The host was very responsive and check-in was completely hassle-free.", rating: 5 },
    { comment: "The photos don't do this place justice! Extremely comfortable beds, peaceful surroundings, and great amenities.", rating: 5 },
    { comment: "Wonderful location with easy access to everything. Very cozy and clean. Would love to stay here again!", rating: 4 },
    { comment: "Super hospitable host and top-notch cleanliness. Loved having morning coffee while soaking in the peaceful atmosphere.", rating: 5 },
    { comment: "Great value for money! Everything matched the description and our family thoroughly enjoyed the trip.", rating: 4 },
    { comment: "Such a charming and serene place to unwind. Spotless rooms, fast Wi-Fi, and very thoughtful touches all around.", rating: 5 },
    { comment: "One of the best stays we've booked! Prime location, aesthetic interior, and warm hospitality. 10/10 recommended.", rating: 5 }
];

const initDB = async () => {
    await Listing.deleteMany({});
    await Review.deleteMany({});

    for (let i = 0; i < initData.data.length; i++) {
        const item = initData.data[i];
        const newListing = new Listing(item);
        newListing.reviews = [];

        const startIndex = (i * 3) % sampleReviewsPool.length;
        for (let j = 0; j < 5; j++) {
            const template = sampleReviewsPool[(startIndex + j) % sampleReviewsPool.length];
            const revDate = new Date();
            revDate.setDate(revDate.getDate() - ((j * 6) + (i % 5)));

            const review = new Review({
                comment: template.comment,
                rating: template.rating,
                createdAt: revDate
            });
            await review.save();
            newListing.reviews.push(review._id);
        }

        await newListing.save();
    }
    console.log('Database initialized with listings and 5 reviews each!');
};