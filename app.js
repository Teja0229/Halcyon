if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const Review = require('./models/review.js');
const User = require('./models/user.js');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { isLoggedIn, saveRedirectUrl, validateListing, validateReview } = require("./middleware.js");
const session = require("express-session");
const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.create ? connectMongo : (connectMongo.MongoStore || connectMongo.default);
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const dbUrl = process.env.ATLASDB_URL || 'mongodb://127.0.0.1:27017/Halcoyn';

main()
    .then(() => console.log('Connected to DB'))
    .catch((err) => console.error(err));

async function main() {
    await mongoose.connect(dbUrl);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')));

// Mongo session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "halyconsupersecretkey2026",
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("ERROR IN MONGO SESSION STORE", err);
});

// Session Configuration
const sessionOptions = {
    store,
    secret: process.env.SECRET || "halyconsupersecretkey2026",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Auth Configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global template locals 
app.use(async (req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    res.locals.cartItems = [];
    res.locals.cartCount = 0;

    if (req.user) {
        try {
            const userDoc = await User.findById(req.user._id).populate({
                path: "cart",
                select: "title image price location country"
            });
            if (userDoc && userDoc.cart) {
                // Filter out any deleted listings that might have populated as null
                const validItems = userDoc.cart.filter(item => item !== null && item !== undefined);
                
                // If any null/deleted listings existed, 
                if (validItems.length !== userDoc.cart.length) {
                    userDoc.cart = validItems.map(item => item._id);
                    await userDoc.save();
                }
                
                res.locals.cartItems = validItems;
                res.locals.cartCount = validItems.length;
                req.user.cart = userDoc.cart;
            }
        } catch (err) {
            console.error("Error populating user cart:", err);
        }
    }
    next();
});

// Root route
app.get('/', (req, res) => {
    res.redirect("/listings");
});

// Authentication Routes (Signup, Login, Logout)

app.get("/signup", (req, res) => {
    if (req.isAuthenticated()) return res.redirect("/listings");
    res.render("users/signup", { layout: "layouts/boilerplate" });
});

app.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password, phone } = req.body;
        let formattedPhone = "";
        if (phone) {
            const rawDigits = phone.replace(/[^0-9]/g, "");
            formattedPhone = rawDigits ? `+91 ${rawDigits.slice(-10)}` : "";
        }
        const newUser = new User({ email, username, phone: formattedPhone });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", `Welcome to Halycon, ${username}! Your account has been created.`);
            const redirectUrl = req.session.redirectUrl || "/listings";
            delete req.session.redirectUrl;
            res.redirect(redirectUrl);
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

app.get("/login", (req, res) => {
    if (req.isAuthenticated()) return res.redirect("/listings");
    res.render("users/login", { layout: "layouts/boilerplate" });
});

app.post("/login", saveRedirectUrl, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash("error", (info && info.message) || "Invalid username or password.");
            return res.redirect("/login");
        }
        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            req.flash("success", `Welcome back, ${user.username}!`);
            const redirectUrl = res.locals.redirectUrl || "/listings";
            res.redirect(redirectUrl);
        });
    })(req, res, next);
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You have been logged out successfully.");
        res.redirect("/listings");
    });
});

// ==========================================
// Cart / Saved Stays Routes
// ==========================================
app.get("/cart", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "Please log in to view your cart & saved stays.");
        return res.redirect("/login");
    }
    const user = await User.findById(req.user._id).populate("cart");
    const validListings = (user && user.cart) ? user.cart.filter(item => item !== null && item !== undefined) : [];
    
    // Purge any deleted listings from the user document
    if (user && user.cart && validListings.length !== user.cart.length) {
        user.cart = validListings.map(item => item._id);
        await user.save();
        req.user.cart = user.cart;
    }
    
    res.render("cart/index", { cartListings: validListings, layout: "layouts/boilerplate" });
}));

// Toggle listing in user's cart (Heart button / Save button)
app.post("/cart/toggle/:id", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ 
            requireLogin: true, 
            redirect: "/login", 
            message: "Please log in to add stays to your cart!" 
        });
    }

    const { id } = req.params;
    const user = await User.findById(req.user._id);
    const existingIndex = user.cart.findIndex(cartId => cartId && cartId.toString() === id.toString());
    let inCart = false;

    if (existingIndex > -1) {
        user.cart.splice(existingIndex, 1);
        inCart = false;
    } else {
        user.cart.push(id);
        inCart = true;
    }

    await user.save();
    req.user.cart = user.cart;

    return res.json({ 
        success: true, 
        inCart, 
        cartCount: user.cart.length,
        message: inCart ? "Added to your saved cart!" : "Removed from your saved cart."
    });
}));

// Remove from cart
app.post("/cart/remove/:id", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        if (req.xhr || req.headers.accept?.includes("application/json")) {
            return res.status(401).json({ requireLogin: true, redirect: "/login" });
        }
        req.flash("error", "Please log in first.");
        return res.redirect("/login");
    }
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (user && user.cart) {
        user.cart = user.cart.filter(cartId => cartId && cartId.toString() !== id.toString());
        await user.save();
        req.user.cart = user.cart;
    }

    if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.json({ 
            success: true, 
            cartCount: user ? user.cart.length : 0, 
            message: "Listing removed from your cart." 
        });
    }

    req.flash("success", "Listing removed from your cart.");
    res.redirect("/cart");
}));

// ==========================================
// Informational / Footer Routes
// ==========================================
app.get("/contact", (req, res) => {
    res.render("pages/contact", { layout: "layouts/boilerplate" });
});

app.get("/careers", (req, res) => {
    res.render("pages/careers", { layout: "layouts/boilerplate" });
});

app.get("/help", (req, res) => {
    res.render("pages/help", { layout: "layouts/boilerplate" });
});

// Listings Routes (with Search Filter)

// index (Supports ?q= query)
app.get("/listings", wrapAsync(async (req, res) => {
    const { q } = req.query;
    let queryFilter = {};

    if (q && q.trim()) {
        const regex = new RegExp(q.trim(), "i");
        queryFilter = {
            $or: [
                { title: regex },
                { location: regex },
                { country: regex }
            ]
        };
    }

    const allListings = await Listing.find(queryFilter);
    res.render("listings/index", { 
        allListings, 
        searchQuery: q ? q.trim() : "", 
        layout: "layouts/boilerplate" 
    });
}));

// new
app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("listings/new", { listing: {}, layout: "layouts/boilerplate" });
});

// show
app.get("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.render("listings/show", { listing, layout: "layouts/boilerplate" });
}));

// book listing (Instant Reservation)
app.post("/listings/:id/book", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");

    const { checkIn, checkOut, guests = 1, guestName, guestPhone } = req.body;
    const bookingCode = "HL-" + Math.floor(1000 + Math.random() * 9000);
    const dateText = (checkIn && checkOut) ? ` (${checkIn} to ${checkOut})` : '';

    // Standardize phone format (+91 XXXXXXXXX)
    let rawDigits = (guestPhone || "").replace(/[^0-9]/g, "");
    if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
        rawDigits = rawDigits.slice(2);
    }
    const formattedPhone = rawDigits ? `+91 ${rawDigits.slice(-10)}` : (guestPhone || "");

    // Calculate total price based on dates
    let nights = 1;
    if (checkIn && checkOut) {
        const d1 = new Date(checkIn);
        const d2 = new Date(checkOut);
        if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
            nights = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        }
    }
    const totalPrice = (listing.price || 0) * nights;

    // Persist booking under logged-in user profile
    if (req.user) {
        const user = await User.findById(req.user._id);
        if (user) {
            if (formattedPhone) user.phone = formattedPhone;
            if (!user.bookings) user.bookings = [];
            user.bookings.push({
                listing: listing._id,
                bookingCode,
                checkIn: checkIn || new Date().toISOString().split('T')[0],
                checkOut: checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
                guests: Number(guests) || 1,
                phone: formattedPhone,
                totalPrice,
                bookedAt: new Date()
            });
            await user.save();
        }
    }

    req.flash("success", `🎉 Booking Confirmed! Your stay at "${listing.title}" is reserved${dateText} for ${guests} guest(s). Contact: ${formattedPhone}. Total: ₹${totalPrice.toLocaleString("en-IN")}. Confirmation Code: #${bookingCode}.`);
    res.redirect(`/listings/${id}`);
}));

// create
app.post("/listings", isLoggedIn, validateListing, wrapAsync(async (req, res, next) => {
    const newlisting = new Listing(req.body.listing);
    await newlisting.save();
    req.flash("success", "New listing created successfully!");
    res.redirect("/listings");
}));

// edit
app.get("/listings/:id/edit", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");
    res.render("listings/edit", { listing, layout: "layouts/boilerplate" });
}));

// update
app.put("/listings/:id", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if (!listing) throw new ExpressError(404, "Listing not found!");
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
}));

// delete
app.delete("/listings/:id", isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) throw new ExpressError(404, "Listing not found!");

    // Clean up this listing from all user carts and delete reviews
    await User.updateMany(
        { cart: id },
        { $pull: { cart: id } }
    );
    if (listing.reviews && listing.reviews.length) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
}));

// ==========================================
// Review Routes
// ==========================================
// post review
app.post("/listings/:id/reviews", isLoggedIn, validateReview, wrapAsync(async(req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${listing._id}`);
}));

// delete review
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
}));

// 404 handler
app.all("/*splat", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

// Error handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { err });
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
});