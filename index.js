require('dotenv').config();
const mongoose = require('mongoose');
const csvAppend = require('csv-append').default;
const RELATIVE_PATH_TO_CSV = `./out.csv`;
const { append, end } = csvAppend(RELATIVE_PATH_TO_CSV);
var flatten = require('flat')
const fs = require('fs');
const axios = require('axios').default;
const FormData = require('form-data');
const Schema = mongoose.Schema;
const data = require('./talabat.json').pageProps.restaurants;
const https = require('https');

function get_url_extension(url) {
    return url.split(/[#?]/)[0].split('.').pop().trim();
}

var genericSchema = new Schema({}, { strict: false });
var Restaurant = mongoose.model('Restaurant', genericSchema);

console.log("Starting...");
(async () => {

    // create a pupeteer instace that gets a fresh id every time
    // after getting the id getting the id query restaurant
    // download images to oouor cdn

    // await mongoose.connect(process.env.MONGO_URL);
    // console.log('MongoDB Connected!');

    for (let index = 1; index < 10; index++) {
        await addKeyOnClickup(index);

    }

})();

async function pushDataToClickup() {

    const places = await Restaurant.find({ $and: [{ "onClickUp": { $exists: false } }, { "data.data": { $exists: true } }] })
        .limit(1000)
        .lean()
        .exec();
    for (var p in places) {
        const restaurant = places[p].data.data;
        console.log(`${p} - ${places.length - 1} ${restaurant.branchSlug}`);
        await saveRestaurantOnClickup(restaurant);
        await Restaurant.findOneAndUpdate({ _id: places[p]._id }, { onClickUp: true }).exec();
    }
    process.exit();
}

async function addKeyOnClickup(page) {
    console.log(`https://api.clickup.com/api/v2/list/900901682805/task?custom_fields=[{"field_id":"5c1c840b-4519-4f67-8cc5-ca65f93d16a2","operator":"IS NULL"}]&page=${page}`);
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://api.clickup.com/api/v2/list/900901682805/task?custom_fields=[{"field_id":"5c1c840b-4519-4f67-8cc5-ca65f93d16a2","operator":"IS NULL"}]&page=${page}`,
        headers: {
            'Authorization': 'pk_3824578_W8120ODZT007T4DX6AC4NXROZXN4ET1S'
        }
    };

    const { data } = await axios.request(config);
    for (const i in data.tasks) {
        const item = data.tasks[i];

        console.log(`${i}-${data.tasks.length} > ${item.name}`);

        const clickupData = {
            "value": `https://www.google.ae/search?q=${item.name} UAE`
        }

        let updateConfig = {
            method: 'POST',
            url: `https://api.clickup.com/api/v2/task/${item.id}/field/5c1c840b-4519-4f67-8cc5-ca65f93d16a2`,
            headers: {
                'Authorization': 'pk_3824578_W8120ODZT007T4DX6AC4NXROZXN4ET1S',
                'Content-Type': 'application/json'
            },
            data: clickupData
        };

        const update = await axios.request(updateConfig);
    }

}

async function saveRestaurantOnClickup(restaurant) {

    return new Promise(async (resolve, reject) => {

        let cityString = "";
        for (const c of restaurant.cities) {
            cityString += `${c.name}, `;
        }



        const clickupData = {
            "name": restaurant.name,
            "description": restaurant.description,
            "custom_fields": [
                {
                    "id": "571f9f9a-26b8-4d4e-908b-87f243734242",
                    "value": restaurant.cuisineString
                },
                {
                    "id": "9e2a8fbf-fbe9-4575-a5ff-0ce5477c8aef",
                    "value": restaurant.logo
                },
                {
                    "id": "5c1c840b-4519-4f67-8cc5-ca65f93d16a2",
                    "value": `https://www.google.ae/search?q=${restaurant.name} UAE`
                },
                {
                    "id": "6d549933-5ef2-4d33-a71b-e1899fd6bc56",
                    "value": parseInt(restaurant.rate)
                },
                {
                    "id": "4836363e-84c9-4c14-bd24-74537079b304",
                    "value": cityString
                },
                {
                    "id": "1ff4ea8a-e90b-47a8-9488-a748bb2cf2a0",
                    "value": `${restaurant.id}`
                },
                {
                    "id": "fcbf2f76-2560-4b65-9110-6eecfbede47b",
                    "value": parseInt(restaurant.shopsCount)
                },
                {
                    "id": "4f19982c-9711-4305-9c50-534b18bed192",
                    "value": restaurant.name
                },
                {
                    "id": "a3131e56-1d95-4b93-85ec-88e8e8226c28",
                    "value": parseInt(restaurant.totalRatings)
                },
                {
                    "id": "14a0c5a6-650e-4156-bd15-086336df56a5",
                    "value": parseInt(restaurant.totalReviews)
                }
            ]
        }

        let config = {
            method: 'post',
            url: 'https://api.clickup.com/api/v2/list/900901682805/task',
            headers: {
                'Authorization': 'pk_3824578_W8120ODZT007T4DX6AC4NXROZXN4ET1S',
                'Content-Type': 'application/json'
            },
            data: clickupData
        };

        const savedResturatnt = await axios.request(config);
        const extension = get_url_extension(restaurant.logo)
        const filePath = `./logos/${restaurant.branchSlug}.${extension}`;
        if (extension.length > 4) {
            console.log(restaurant.logo)
            console.log('skip image save');
            return resolve();

        }
        const file = fs.createWriteStream(filePath);
        https.get(restaurant.logo, function (response) {
            response.pipe(file);
            file.on("finish", async () => {
                file.close();

                const form = new FormData();

                form.append('attachment', fs.createReadStream(filePath));

                const request_config = {
                    headers: {
                        'Authorization': 'pk_3824578_W8120ODZT007T4DX6AC4NXROZXN4ET1S',
                        ...form.getHeaders()
                    }
                };

                let fileUploaded = false;
                try {
                    await axios.post(`https://api.clickup.com/api/v2/task/${savedResturatnt.data.id}/attachment`, form, request_config);
                } catch (error) {
                    try {
                        console.log('file upload 2nd try in 2 seconds');
                        await new Promise(r => setTimeout(r, 2000));
                        await axios.post(`https://api.clickup.com/api/v2/task/${savedResturatnt.data.id}/attachment`, form, request_config);
                    } catch (error) {
                        try {
                            console.log('file upload 3rd try in 5 seconds');
                            await new Promise(r => setTimeout(r, 5000));
                            await axios.post(`https://api.clickup.com/api/v2/task/${savedResturatnt.data.id}/attachment`, form, request_config);
                        } catch (error) {
                            console.log('Upload failed after 2 try')
                            throw (new Error('Image upload Error'))
                        }
                    }
                }
                fs.unlinkSync(filePath);
                return resolve();
            });
        });
    });


}

async function exportCSV() {
    await mongoose.connect(process.env.MONGO_URL);

    console.log('MongoDB Connected!');

    const places = await Restaurant.find({ $and: [{ "data.data": { $exists: true } }, { export: { $exists: false } }] })
        .lean()
        .exec();
    for (var i in places) {
        const place = flatten(places[i]);
        append(place);
        // await Restaurant.findOneAndUpdate({ _id: places[i]._id }, { export: true }).exec();
        console.log(`${i} - ${places.length} | ${place.name}`);

    }
    await end();
    console.log("Done");
    process.exit();



}

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

