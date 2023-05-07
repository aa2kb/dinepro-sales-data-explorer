require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const axios = require('axios').default;
const Schema = mongoose.Schema;
const data = require('./talabat.json').pageProps.restaurants;

var genericSchema = new Schema({}, { strict: false });
var Restaurant = mongoose.model('Restaurant', genericSchema);

console.log("Starting...");
(async () => {

    // create a pupeteer instace that gets a fresh id every time
    // after getting the id getting the id query restaurant
    // download images to oouor cdn

    await updateData();


})();

async function updateData() {
    await mongoose.connect(process.env.MONGO_URL);

    console.log('MongoDB Connected!');

    const places = await Restaurant.find({ $and: [{ "data.data": { $exists: true } }, { totalRatings: { $exists: false } }] })
        .select('_id data.data')
        .exec();
    for (var i in places) {
        const totalRatings = parseInt(places[i].data.totalRatings);
        await Restaurant.findOneAndUpdate({ _id: places[i]._id }, { totalRatings }).exec();
        console.log(`${i} - ${places.length}`);
    }

    console.log("Done");
    process.exit();



}
async function populateRestaurant() {

    await mongoose.connect(process.env.MONGO_URL);

    console.log('MongoDB Connected!');

    const places = await Restaurant.find({ $and: [{ data: { $exists: false } }, { missingData: { $exists: false } }] })
        .select('slug')
        .limit(5000)
        .exec();

    for (var looper in places) {
        console.log(`${places.length} - ${looper} Saving: ${places[looper].slug}`);
        try {
            const response = await axios.get(`https://www.talabat.com/_next/data/f9c3e16a-c127-43e0-8b87-1fe72a38e1db/brand.json?countrySlug=uae&brandSlug=${places[looper].slug}`);
            await Restaurant.findOneAndUpdate({ slug: places[looper].slug }, { data: response.data.pageProps }).exec();
        } catch (error) {
            console.log(`Not Found ${places[looper].slug}`);
            await Restaurant.findOneAndUpdate({ slug: places[looper].slug }, { missingData: true }).exec();
        }

    }

    console.log("Done");
    process.exit();




}

async function jsonToDB() {


    await mongoose.connect(process.env.MONGO_URL);

    console.log('MongoDB Connected!');
    for (const place of data) {
        console.log(place);
        // process.exit();
        place.restaurantId = place.id;
        const existingPlace = await Restaurant.findOne({ slug: place.slug }).exec();
        if (existingPlace) {
            console.log(`Existing Place ${place.name}`);
            continue;
        }
        var RestaurantItem = new Restaurant(place);
        await RestaurantItem.save();
        console.log(`Saved ${place.name}`);
    }

    console.log("Done!");
    process.exit();
}