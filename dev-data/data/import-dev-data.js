const fs = require("fs");
require('dotenv').config()
const mongoose = require("mongoose");
const DB = process.env.DATABASE.replace("%PASSWORD%", process.env.DATABASE_PASSWORD);
const Tour = require("../../models/tours");
const Review = require("../../models/review");
const User = require("../../models/user");
mongoose.connect(DB, {
    // mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => {
    console.log("DB connection successful");
}).catch(e => (console.log(e)));


// Read Json file 

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"));
// import data in the database. 

const importData = async () => {
    try {
        await Tour.create(tours);
        await Review.create(reviews);
        await User.create(users);
        console.log("Data Successfully loaded!");
        process.exit();
    } catch (e) {
        console.log(e);
    }
}

//  To delete all data from the database from
const deleteData = async () => {
    try {
        const deletedTours = await Tour.deleteMany();
        const deletedUsers = await Review.deleteMany();
        const deletedReviews = await User.deleteMany();
        console.log("deleted Tours, Reviews and Users");
        process.exit();
    } catch (e) {
        console.log(e);
    }
}
console.log(process.argv);
if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}
