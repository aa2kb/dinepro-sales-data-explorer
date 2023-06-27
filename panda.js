const fs = require('fs');
const csvAppend = require('csv-append').default;
const { append, end } = csvAppend('./panda-khi.csv');
const pandaLeads = require('./panda-data/foodpanda-pk-khi.json');
const csvFile = 'panda-pk-khi.csv';

(async () => {
    for (location of pandaLeads.data.items) {
        console.log(location.name);
        const restObj = {
            name: location.name,
            id: location.id,
            primaryCuisineId: location.primary_cuisine_id,
            address: location.address,
            chainCode: location.chain.code,
            chainName: location.chain.name,
            chainMainCode: location.chain.main_vendor_code,
            cuisines: location.cuisines.map(i => i.name).join(', '),
            heroImage: location.hero_image,
            heroListingImage: location.hero_listing_image,
            latitude: location.latitude,
            longitude: location.longitude,
            minimumDeliveryTime: location.minimum_delivery_time,
            minimumDeliveryTimeUpperLimit: location?.delivery_duration_range?.upper_limit_in_minutes || "",
            minimumDeliveryTimeLowerLimit: location?.delivery_duration_range?.lower_limit_in_minutes || "",
            minimumOrderAmount: location.minimum_order_amount,
            minimumPickupTime: location.minimum_pickup_time,
            postCode: location.post_code,
            rating: location.rating,
            urlKey: location.url_key,
            reviewNumber: location.review_number,
            vendorPoints: location.vendor_points,
            webPath: location.web_path,
            legalName: location.vendor_legal_information.legal_name,
            tradeRegisterNumber: location.vendor_legal_information.trade_register_number,
            customerPhone: location.customer_phone,
            vertical: location.vertical_type_ids.join(', '),
            deliveryProvider: location.delivery_provider,
            isActive: location.is_active,
            is_best_in_city: location.is_best_in_city,
            is_new: location.is_new,
            is_delivery_enabled: location.is_delivery_enabled,
            is_pickup_enabled: location.is_pickup_enabled,
            is_service_fee_enabled: location.is_service_fee_enabled,
            is_test: location.is_test,
            is_promoted: location.is_promoted,
        };
        append(restObj);
    }
    end();
})()