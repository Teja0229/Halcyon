const mongoose = require('mongoose');
const Listing = require('../models/listing.js');
const Review = require('../models/review.js');

const MONGO_URL = 'mongodb://127.0.0.1:27017/Halcoyn';

const sampleReviewsPool = [
    {
        comment: "Absolutely breathtaking experience! The place was spotless, beautifully designed, and the views were mesmerizing.",
        rating: 5,
    },
    {
        comment: "Had an incredible weekend getaway here. The host was very responsive and check-in was completely hassle-free.",
        rating: 5,
    },
    {
        comment: "The photos don't do this place justice! Extremely comfortable beds, peaceful surroundings, and great amenities.",
        rating: 5,
    },
    {
        comment: "Wonderful location with easy access to everything. Very cozy and clean. Would love to stay here again!",
        rating: 4,
    },
    {
        comment: "Super hospitable host and top-notch cleanliness. Loved having morning coffee while soaking in the peaceful atmosphere.",
        rating: 5,
    },
    {
        comment: "Great value for money! Everything matched the description and our family thoroughly enjoyed the trip.",
        rating: 4,
    },
    {
        comment: "Such a charming and serene place to unwind. Spotless rooms, fast Wi-Fi, and very thoughtful touches all around.",
        rating: 5,
    },
    {
        comment: "One of the best stays we've booked! Prime location, aesthetic interior, and warm hospitality. 10/10 recommended.",
        rating: 5,
    },
    {
        comment: "Very relaxing ambiance and well-equipped kitchen. Perfect spot for both remote work and a quiet holiday.",
        rating: 4,
    },
    {
        comment: "Loved every minute of our stay! Sparkling clean, comfortable, and the surroundings are simply gorgeous.",
        rating: 5,
    }
];

async function seedReviews() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB for review seeding...");

    // Clear old reviews
    await Review.deleteMany({});
    console.log("Cleared existing reviews.");

    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings to populate with reviews.`);

    let totalReviewsAdded = 0;

    for (let i = 0; i < listings.length; i++) {
        const listing = listings[i];
        listing.reviews = [];

        // Pick 5 distinct reviews from the pool using an offset
        const startIndex = (i * 3) % sampleReviewsPool.length;
        const selectedReviews = [];

        for (let j = 0; j < 5; j++) {
            const poolIndex = (startIndex + j) % sampleReviewsPool.length;
            const reviewTemplate = sampleReviewsPool[poolIndex];

            // Vary dates slightly over the last few months
            const daysAgo = (j * 6) + (i % 5);
            const reviewDate = new Date();
            reviewDate.setDate(reviewDate.getDate() - daysAgo);

            const newReview = new Review({
                comment: reviewTemplate.comment,
                rating: reviewTemplate.rating,
                createdAt: reviewDate
            });

            await newReview.save();
            listing.reviews.push(newReview._id);
            totalReviewsAdded++;
        }

        await listing.save();
    }

    console.log(`Successfully added ${totalReviewsAdded} reviews across ${listings.length} listings (5 reviews per listing)!`);
    process.exit(0);
}

seedReviews().catch(err => {
    console.error("Error seeding reviews:", err);
    process.exit(1);
});
