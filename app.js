const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js")
//const Reviews = require('./models/review.js');


const MONGO_URL = 'mongodb://127.0.0.1:27017/Halcoyn';

main()
    .then(() => console.log('Connected to DB'))
    .catch((err) => console.error(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send("Hi i am root");
});

const validateListing = (req, res, next) =>{
    let {error} = listingSchema.validate(req.body);
    
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);    
     
    }else {
        next();
    }
};



const validateReview = (req, res, next) =>{
    let {error} = reviewSchema.validate(req.body);
    
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);    
     
    }else {
        next();
    }
};



// index
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index", { allListings, layout: "layouts/boilerplate" });
}));

// new
app.get("/listings/new", (req, res) => {
    res.render("listings/new", { listing: {}, layout: "layouts/boilerplate" });
});

// show
app.get("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.render("listings/show", { listing, layout: "layouts/boilerplate" });
}));

// create
app.post("/listings", validateListing, wrapAsync(async (req, res, next) => {
    let result = listingSchema.validate(req.body);
   
   
    const newlisting = new Listing(req.body.listing);   // ← lowercase 'l'
    await newlisting.save();                            // ← matches, but...
    res.redirect("/listings");
}));

// edit
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.render("listings/edit", { listing, layout: "layouts/boilerplate" });
}));

// update
app.put("/listings/:id",
    validateListing,
     wrapAsync(async (req, res) => {
   
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.redirect(`/listings/${id}`);
}));

// delete
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");
    console.log('deleted listing');
    res.redirect("/listings");
}));

//review
//post review
app.post("/listings/:id/reviews", validateReview,
    wrapAsync(async(req, res)=> {
    let listing = await Listing.findById(req.params.id);
    let newReview = new review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();


    res.redirect(`/listings/${listings._id}`);

}));







// 404 handler
app.all("/*splat", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

// error handler
app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});