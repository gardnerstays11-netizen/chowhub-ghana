import bcrypt from "bcrypt";
import { db, usersTable, vendorsTable, listingsTable, listingPhotosTable, menuItemsTable, reviewsTable, reservationsTable, ordersTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  const pw = await bcrypt.hash("password123", 10);
  const adminPw = await bcrypt.hash("admin123", 10);

  const [admin] = await db.insert(usersTable).values({
    name: "Admin Kwame",
    email: "admin@chowhub.gh",
    phone: "+233201234567",
    password: adminPw,
    city: "Accra",
    role: "admin",
  }).returning();

  const [user1] = await db.insert(usersTable).values({
    name: "Ama Mensah",
    email: "ama@example.com",
    phone: "+233241234567",
    password: pw,
    city: "Accra",
  }).returning();

  const [user2] = await db.insert(usersTable).values({
    name: "Kofi Asante",
    email: "kofi@example.com",
    phone: "+233271234567",
    password: pw,
    city: "Kumasi",
  }).returning();

  const [vendor1] = await db.insert(vendorsTable).values({
    businessName: "Auntie Muni's Kitchen",
    email: "muni@chowhub.gh",
    phone: "+233301234567",
    password: pw,
    status: "approved",
    plan: "premium",
    planExpiresAt: new Date("2027-12-31"),
  }).returning();

  const [vendor2] = await db.insert(vendorsTable).values({
    businessName: "Chop Bar Central",
    email: "chopbar@chowhub.gh",
    phone: "+233501234567",
    password: pw,
    status: "approved",
    plan: "free",
  }).returning();

  const [vendor3] = await db.insert(vendorsTable).values({
    businessName: "Golden Tulip Bites",
    email: "goldentulip@chowhub.gh",
    phone: "+233551234567",
    password: pw,
    status: "pending",
    plan: "free",
  }).returning();

  const listingsData = [
    {
      vendorId: vendor1.id, name: "Auntie Muni's Kitchen", slug: "auntie-munis-kitchen-accra",
      description: "Authentic Ghanaian home cooking with a modern twist. Famous for our fufu with light soup and jollof rice that keeps people coming back for more. A cozy spot in the heart of Osu.",
      category: "restaurant", cuisineType: ["Ghanaian", "West African"], diningStyle: "casual", mealPeriod: ["lunch", "dinner"],
      priceRange: "$$", city: "Accra", area: "Osu", neighbourhood: "Oxford Street", address: "15 Oxford St, Osu, Accra",
      landmark: "Near the Osu Night Market", lat: 5.5600, lng: -0.1869, phone: "+233301234567", whatsapp: "+233301234567",
      website: "https://auntiemuni.gh", instagram: "@auntiemuni", openingHours: { mon: "10:00-22:00", tue: "10:00-22:00", wed: "10:00-22:00", thu: "10:00-22:00", fri: "10:00-23:00", sat: "10:00-23:00", sun: "12:00-20:00" },
      features: ["wifi", "outdoor_seating", "live_music", "parking"], dressCode: "casual",
      acceptsReservations: true, acceptsOrders: true, isFeatured: true, isVerified: true, status: "active",
      averageRating: 4.7, totalReviews: 3,
      metaTitle: "Auntie Muni's Kitchen — Best Ghanaian Food in Osu, Accra | ChowHub",
      metaDescription: "Enjoy authentic fufu with light soup, jollof rice, and more at Auntie Muni's Kitchen in Osu, Accra. Reserve a table or order for delivery.",
    },
    {
      vendorId: vendor2.id, name: "Chop Bar Central", slug: "chop-bar-central-accra",
      description: "The ultimate chop bar experience. We serve classic Ghanaian street food in a clean, vibrant setting. Banku & tilapia, waakye, kenkey — all your favourites.",
      category: "chop_bar", cuisineType: ["Ghanaian", "Street Food"], diningStyle: "casual", mealPeriod: ["breakfast", "lunch", "dinner"],
      priceRange: "$", city: "Accra", area: "Madina", neighbourhood: "Madina Market", address: "22 Market Rd, Madina, Accra",
      landmark: "Opposite Madina Market", lat: 5.6700, lng: -0.1650, phone: "+233501234567", whatsapp: "+233501234567",
      openingHours: { mon: "06:00-21:00", tue: "06:00-21:00", wed: "06:00-21:00", thu: "06:00-21:00", fri: "06:00-22:00", sat: "06:00-22:00", sun: "08:00-18:00" },
      features: ["takeaway", "group_dining"], dressCode: "casual",
      acceptsReservations: false, acceptsOrders: true, isFeatured: true, isVerified: true, status: "active",
      averageRating: 4.3, totalReviews: 2,
      metaTitle: "Chop Bar Central — Authentic Street Food in Madina, Accra | ChowHub",
      metaDescription: "Banku & tilapia, waakye, kenkey — all your Ghanaian street food favourites at Chop Bar Central, Madina.",
    },
    {
      vendorId: vendor1.id, name: "The Palm Wine Spot", slug: "the-palm-wine-spot-kumasi",
      description: "Kumasi's favourite palm wine bar and grill. Live highlife music every Friday and Saturday. Fresh grilled tilapia, kelewele, and the best palm wine in Ashanti Region.",
      category: "bar_grill", cuisineType: ["Ghanaian", "Grill"], diningStyle: "casual", mealPeriod: ["dinner"],
      priceRange: "$$", city: "Kumasi", area: "Adum", neighbourhood: "Kejetia", address: "5 Adum St, Kumasi",
      landmark: "Near Kejetia Market", lat: 6.6885, lng: -1.6244, phone: "+233201111111", whatsapp: "+233201111111",
      openingHours: { mon: "16:00-23:00", tue: "16:00-23:00", wed: "16:00-23:00", thu: "16:00-23:00", fri: "16:00-01:00", sat: "16:00-01:00", sun: "closed" },
      features: ["live_music", "outdoor_seating", "parking"], dressCode: "casual",
      acceptsReservations: true, acceptsOrders: false, isFeatured: true, isVerified: true, status: "active",
      averageRating: 4.5, totalReviews: 2,
    },
    {
      vendorId: vendor2.id, name: "Mama's Waakye Joint", slug: "mamas-waakye-joint-accra",
      description: "The most talked-about waakye in all of Accra. Mama's secret recipe has been perfected over 30 years. Early morning queues tell the story.",
      category: "street_food", cuisineType: ["Ghanaian", "Street Food"], diningStyle: "street", mealPeriod: ["breakfast", "lunch"],
      priceRange: "$", city: "Accra", area: "Kaneshie", neighbourhood: "Kaneshie First Light", address: "Kaneshie Market Rd, Accra",
      landmark: "Near First Light junction", lat: 5.5750, lng: -0.2300, phone: "+233241111111", whatsapp: "+233241111111",
      openingHours: { mon: "05:00-14:00", tue: "05:00-14:00", wed: "05:00-14:00", thu: "05:00-14:00", fri: "05:00-14:00", sat: "05:00-15:00", sun: "closed" },
      features: ["takeaway"], dressCode: "casual",
      acceptsReservations: false, acceptsOrders: true, isFeatured: false, isVerified: true, status: "active",
      averageRating: 4.8, totalReviews: 1,
    },
    {
      vendorId: vendor1.id, name: "Skybar Lounge", slug: "skybar-lounge-accra",
      description: "Accra's premier rooftop dining experience. Pan-African cuisine with breathtaking views of the city skyline. Perfect for date nights and special celebrations.",
      category: "fine_dining", cuisineType: ["Pan-African", "Continental", "Fusion"], diningStyle: "fine_dining", mealPeriod: ["dinner"],
      priceRange: "$$$$", city: "Accra", area: "Airport Residential", neighbourhood: "Airport City", address: "Plot 7, Airport City, Accra",
      landmark: "Top floor, Airport City Mall", lat: 5.6050, lng: -0.1720, phone: "+233302222222", whatsapp: "+233302222222",
      website: "https://skybaraccra.com", instagram: "@skybaraccra",
      openingHours: { mon: "18:00-23:00", tue: "18:00-23:00", wed: "18:00-23:00", thu: "18:00-23:00", fri: "18:00-01:00", sat: "18:00-01:00", sun: "17:00-22:00" },
      features: ["rooftop", "live_music", "cocktails", "dress_code", "parking", "wifi"], dressCode: "smart_casual",
      acceptsReservations: true, acceptsOrders: false, isFeatured: true, isVerified: true, status: "active",
      averageRating: 4.6, totalReviews: 1,
    },
    {
      vendorId: vendor2.id, name: "Buka Hut Takoradi", slug: "buka-hut-takoradi",
      description: "Nigerian-Ghanaian fusion at its best. Our pounded yam and egusi soup is legendary in the Western Region. Fast service, generous portions.",
      category: "restaurant", cuisineType: ["Nigerian", "Ghanaian", "West African"], diningStyle: "casual", mealPeriod: ["lunch", "dinner"],
      priceRange: "$$", city: "Takoradi", area: "Market Circle", neighbourhood: "Market Circle", address: "12 Market Circle, Takoradi",
      landmark: "Behind Market Circle", lat: 4.8980, lng: -1.7610, phone: "+233312222222", whatsapp: "+233312222222",
      openingHours: { mon: "10:00-22:00", tue: "10:00-22:00", wed: "10:00-22:00", thu: "10:00-22:00", fri: "10:00-22:00", sat: "10:00-22:00", sun: "12:00-20:00" },
      features: ["wifi", "group_dining", "takeaway"], dressCode: "casual",
      acceptsReservations: true, acceptsOrders: true, isFeatured: false, isVerified: true, status: "active",
      averageRating: 4.4, totalReviews: 1,
    },
    {
      vendorId: vendor1.id, name: "Café Kwame", slug: "cafe-kwame-accra",
      description: "Specialty coffee meets Ghanaian brunch culture. Locally roasted beans, freshly baked pastries, and a fusion breakfast menu. Perfect work-from-cafe vibes.",
      category: "cafe", cuisineType: ["Ghanaian", "Continental", "Brunch"], diningStyle: "casual", mealPeriod: ["breakfast", "lunch"],
      priceRange: "$$", city: "Accra", area: "East Legon", neighbourhood: "Trassaco", address: "4 Boundary Rd, East Legon, Accra",
      landmark: "Near A&C Mall", lat: 5.6350, lng: -0.1550, phone: "+233241234999", whatsapp: "+233241234999",
      instagram: "@cafekwame",
      openingHours: { mon: "07:00-18:00", tue: "07:00-18:00", wed: "07:00-18:00", thu: "07:00-18:00", fri: "07:00-20:00", sat: "08:00-20:00", sun: "08:00-16:00" },
      features: ["wifi", "outdoor_seating", "power_outlets", "parking"], dressCode: "casual",
      acceptsReservations: false, acceptsOrders: true, isFeatured: true, isVerified: true, status: "active",
      averageRating: 4.5, totalReviews: 1,
    },
    {
      vendorId: vendor2.id, name: "Asanka Delight", slug: "asanka-delight-tamale",
      description: "Northern Ghana's premier dining spot. Authentic TZ with ayoyo soup, guinea fowl stew, and all the Northern delicacies you love. Made with love in the heart of Tamale.",
      category: "restaurant", cuisineType: ["Ghanaian", "Northern Ghanaian"], diningStyle: "casual", mealPeriod: ["lunch", "dinner"],
      priceRange: "$", city: "Tamale", area: "Central", neighbourhood: "Tamale Central", address: "Main St, Tamale",
      landmark: "Near Tamale Central Mosque", lat: 9.4035, lng: -0.8424, phone: "+233372222222", whatsapp: "+233372222222",
      openingHours: { mon: "09:00-21:00", tue: "09:00-21:00", wed: "09:00-21:00", thu: "09:00-21:00", fri: "09:00-22:00", sat: "09:00-22:00", sun: "10:00-20:00" },
      features: ["group_dining", "takeaway", "parking"], dressCode: "casual",
      acceptsReservations: true, acceptsOrders: true, isFeatured: false, isVerified: true, status: "active",
      averageRating: 4.6, totalReviews: 1,
    },
    {
      vendorId: vendor1.id, name: "The Coconut Grove", slug: "the-coconut-grove-accra",
      description: "Beachside dining at Labadi. Fresh seafood, tropical cocktails, and live band every weekend. The perfect spot to enjoy Accra's coastal breeze.",
      category: "seafood", cuisineType: ["Seafood", "Ghanaian", "Grill"], diningStyle: "casual", mealPeriod: ["lunch", "dinner"],
      priceRange: "$$$", city: "Accra", area: "Labadi", neighbourhood: "Labadi Beach", address: "Labadi Beach Rd, Accra",
      landmark: "On Labadi Beach", lat: 5.5560, lng: -0.1430, phone: "+233241234888", whatsapp: "+233241234888",
      instagram: "@coconutgroveaccra",
      openingHours: { mon: "11:00-23:00", tue: "11:00-23:00", wed: "11:00-23:00", thu: "11:00-23:00", fri: "11:00-01:00", sat: "11:00-01:00", sun: "11:00-22:00" },
      features: ["beachfront", "live_music", "cocktails", "outdoor_seating", "parking"], dressCode: "casual",
      acceptsReservations: true, acceptsOrders: false, isFeatured: true, isVerified: true, status: "active",
      averageRating: 4.4, totalReviews: 1,
    },
    {
      vendorId: vendor2.id, name: "Kumasi Kelewele King", slug: "kumasi-kelewele-king",
      description: "The kelewele here is something else! Best spiced fried plantain in Kumasi, served with groundnuts and optional grilled chicken. Quick, affordable, and delicious.",
      category: "street_food", cuisineType: ["Ghanaian", "Street Food"], diningStyle: "street", mealPeriod: ["dinner"],
      priceRange: "$", city: "Kumasi", area: "Bantama", neighbourhood: "Bantama High Street", address: "Bantama High St, Kumasi",
      landmark: "Near Bantama Market", lat: 6.7000, lng: -1.6400, phone: "+233271234888", whatsapp: "+233271234888",
      openingHours: { mon: "17:00-23:00", tue: "17:00-23:00", wed: "17:00-23:00", thu: "17:00-23:00", fri: "17:00-00:00", sat: "17:00-00:00", sun: "17:00-22:00" },
      features: ["takeaway"], dressCode: "casual",
      acceptsReservations: false, acceptsOrders: true, isFeatured: false, isVerified: false, status: "active",
      averageRating: 4.2, totalReviews: 1,
    },
  ];

  const listings = await db.insert(listingsTable).values(listingsData).returning();
  console.log(`Inserted ${listings.length} listings`);

  const photoData = listings.flatMap((l, i) => {
    const suffix1 = String(i * 2 + 10).padStart(2, "0");
    const suffix2 = String(i * 2 + 11).padStart(2, "0");
    return [
      { listingId: l.id, url: `https://images.unsplash.com/photo-1555396273-132fba8c${suffix1}?w=800&h=600&fit=crop`, isCover: true, displayOrder: 0 },
      { listingId: l.id, url: `https://images.unsplash.com/photo-1555396273-132fba8c${suffix2}?w=800&h=600&fit=crop`, isCover: false, displayOrder: 1 },
    ];
  });
  await db.insert(listingPhotosTable).values(photoData);
  console.log(`Inserted ${photoData.length} photos`);

  const menuData = [
    { listingId: listings[0].id, name: "Fufu with Light Soup", description: "Pounded cassava and plantain served with spicy light soup, goat meat, and tripe", price: 45, category: "Mains", isPopular: true },
    { listingId: listings[0].id, name: "Jollof Rice with Chicken", description: "Smoky party-style jollof with perfectly grilled chicken", price: 40, category: "Mains", isPopular: true },
    { listingId: listings[0].id, name: "Banku with Okro Stew", description: "Fermented corn dough with rich okro stew and fresh fish", price: 35, category: "Mains" },
    { listingId: listings[0].id, name: "Kelewele", description: "Spiced fried plantain cubes — the perfect side", price: 12, category: "Sides", isPopular: true },
    { listingId: listings[0].id, name: "Red Red", description: "Black-eyed bean stew with fried plantain", price: 25, category: "Mains" },
    { listingId: listings[0].id, name: "Sobolo", description: "Chilled hibiscus drink with ginger and spices", price: 8, category: "Drinks", isPopular: true },
    { listingId: listings[1].id, name: "Banku & Tilapia", description: "Grilled tilapia with banku, hot pepper, and shito", price: 30, category: "Mains", isPopular: true },
    { listingId: listings[1].id, name: "Waakye Special", description: "Rice and beans with spaghetti, gari, egg, stew, and shito", price: 20, category: "Mains", isPopular: true },
    { listingId: listings[1].id, name: "Kenkey & Fried Fish", description: "Fermented corn dough with crispy fried fish and pepper", price: 18, category: "Mains" },
    { listingId: listings[1].id, name: "Hausa Koko", description: "Spiced millet porridge — classic Ghanaian breakfast", price: 5, category: "Breakfast" },
    { listingId: listings[2].id, name: "Grilled Tilapia", description: "Whole tilapia grilled with spices, served with banku", price: 55, category: "Grill", isPopular: true },
    { listingId: listings[2].id, name: "Kelewele & Groundnuts", description: "Spiced fried plantain with roasted groundnuts", price: 15, category: "Sides" },
    { listingId: listings[2].id, name: "Fresh Palm Wine", description: "Tapped daily from the finest palms", price: 10, category: "Drinks", isPopular: true },
    { listingId: listings[4].id, name: "Pan-African Tasting Menu", description: "5-course journey through Africa's best flavours", price: 200, category: "Tasting Menu", isPopular: true },
    { listingId: listings[4].id, name: "Wagyu Suya", description: "Premium wagyu with authentic suya spice", price: 120, category: "Mains" },
    { listingId: listings[4].id, name: "Craft Cocktails", description: "Mixologist-crafted cocktails with local spirits", price: 45, category: "Drinks", isPopular: true },
    { listingId: listings[6].id, name: "Ghanaian Espresso", description: "Single-origin beans from the Volta Region", price: 15, category: "Coffee", isPopular: true },
    { listingId: listings[6].id, name: "Bofrot (Doughnuts)", description: "Freshly fried Ghanaian doughnuts", price: 8, category: "Pastries" },
    { listingId: listings[6].id, name: "Avocado Toast with Shito", description: "Fusion brunch — avocado on sourdough with house-made shito", price: 28, category: "Brunch", isPopular: true },
    { listingId: listings[7].id, name: "TZ with Ayoyo Soup", description: "Traditional TZ with ayoyo soup and guinea fowl", price: 25, category: "Mains", isPopular: true },
    { listingId: listings[7].id, name: "Guinea Fowl Stew", description: "Slow-cooked guinea fowl in rich tomato stew", price: 35, category: "Mains" },
  ];
  await db.insert(menuItemsTable).values(menuData);
  console.log(`Inserted ${menuData.length} menu items`);

  const reviewsData = [
    { listingId: listings[0].id, userId: user1.id, rating: 5, foodRating: 5, serviceRating: 5, ambienceRating: 4, valueRating: 5, comment: "The fufu with light soup here is absolutely divine! Best I've had outside my grandmother's kitchen. The goat meat was tender and perfectly seasoned.", visitedFor: "dinner" },
    { listingId: listings[0].id, userId: user2.id, rating: 4, foodRating: 5, serviceRating: 4, ambienceRating: 4, valueRating: 4, comment: "Jollof rice was smoky and delicious. Reminded me of a proper Ghanaian party. Service was friendly but a bit slow on weekends.", visitedFor: "lunch" },
    { listingId: listings[0].id, userId: admin.id, rating: 5, foodRating: 5, serviceRating: 5, ambienceRating: 5, valueRating: 4, comment: "Took my family here for a birthday celebration. Everything was perfect — the red red was incredible and the sobolo was so refreshing.", visitedFor: "dinner" },
    { listingId: listings[1].id, userId: user1.id, rating: 4, foodRating: 5, serviceRating: 4, ambienceRating: 3, valueRating: 5, comment: "The waakye special is unbeatable for the price! Massive portions. The shito is addictive. Atmosphere is basic but the food more than makes up for it.", visitedFor: "lunch" },
    { listingId: listings[1].id, userId: user2.id, rating: 5, foodRating: 5, serviceRating: 4, ambienceRating: 4, valueRating: 5, comment: "Banku and tilapia was perfect. The fish was fresh and the pepper was just right. This is proper Ghanaian food at its best.", visitedFor: "dinner" },
    { listingId: listings[2].id, userId: user1.id, rating: 5, foodRating: 5, serviceRating: 4, ambienceRating: 5, valueRating: 4, comment: "The live highlife music on Friday was amazing! Grilled tilapia was fresh and the palm wine was perfect. Great vibe all round.", visitedFor: "dinner" },
    { listingId: listings[2].id, userId: user2.id, rating: 4, foodRating: 4, serviceRating: 4, ambienceRating: 5, valueRating: 4, comment: "Love the atmosphere here. The kelewele was some of the best I've had. Palm wine was authentic. Will definitely come back.", visitedFor: "dinner" },
    { listingId: listings[3].id, userId: user1.id, rating: 5, foodRating: 5, serviceRating: 5, ambienceRating: 3, valueRating: 5, comment: "Mama's waakye is truly legendary! Got there at 6am and there was already a queue. Worth every minute of waiting.", visitedFor: "breakfast" },
    { listingId: listings[4].id, userId: user2.id, rating: 5, foodRating: 5, serviceRating: 5, ambienceRating: 5, valueRating: 3, comment: "Incredible rooftop views and the tasting menu was an unforgettable experience. Pricey but worth it for special occasions.", visitedFor: "dinner" },
    { listingId: listings[5].id, userId: user1.id, rating: 4, foodRating: 5, serviceRating: 4, ambienceRating: 4, valueRating: 5, comment: "The pounded yam and egusi soup reminded me of my Nigerian roots. Generous portions and quick service. Great fusion spot.", visitedFor: "lunch" },
    { listingId: listings[6].id, userId: user2.id, rating: 5, foodRating: 4, serviceRating: 5, ambienceRating: 5, valueRating: 4, comment: "The espresso is amazing — best coffee in Accra, hands down. The avocado toast with shito is a genius combo. Great workspace too.", visitedFor: "breakfast" },
    { listingId: listings[7].id, userId: user1.id, rating: 5, foodRating: 5, serviceRating: 4, ambienceRating: 4, valueRating: 5, comment: "Authentic Northern food! The TZ with ayoyo soup took me back to my childhood in Tamale. You can taste the love in every bite.", visitedFor: "lunch" },
    { listingId: listings[8].id, userId: user2.id, rating: 4, foodRating: 5, serviceRating: 4, ambienceRating: 5, valueRating: 4, comment: "Beautiful beachside setting and the grilled lobster was incredible. The live band on Saturday was a great touch.", visitedFor: "dinner" },
    { listingId: listings[9].id, userId: user1.id, rating: 4, foodRating: 5, serviceRating: 4, ambienceRating: 3, valueRating: 5, comment: "Simple but perfect kelewele. The groundnuts are the perfect accompaniment. Quick service and very affordable.", visitedFor: "dinner" },
  ];
  await db.insert(reviewsTable).values(reviewsData);
  console.log(`Inserted ${reviewsData.length} reviews`);

  await db.insert(reservationsTable).values([
    { listingId: listings[0].id, userId: user1.id, date: "2026-04-05", time: "19:00", partySize: 4, occasion: "birthday", specialRequests: "Window seat please", status: "confirmed" },
    { listingId: listings[4].id, userId: user2.id, date: "2026-04-10", time: "20:00", partySize: 2, occasion: "anniversary", status: "pending" },
    { listingId: listings[2].id, userId: user1.id, date: "2026-04-12", time: "18:30", partySize: 6, specialRequests: "Near the band stage", status: "pending" },
  ]);
  console.log("Inserted 3 reservations");

  await db.insert(ordersTable).values([
    { listingId: listings[0].id, userId: user1.id, items: [{ name: "Jollof Rice with Chicken", quantity: 2, price: 40 }, { name: "Sobolo", quantity: 3, price: 8 }], orderType: "delivery", deliveryAddress: "12 Cantonments Rd, Accra", status: "confirmed" },
    { listingId: listings[1].id, userId: user2.id, items: [{ name: "Waakye Special", quantity: 3, price: 20 }, { name: "Banku & Tilapia", quantity: 1, price: 30 }], orderType: "pickup", status: "pending" },
  ]);
  console.log("Inserted 2 orders");

  console.log("\nSeed complete!");
  console.log("Admin login: admin@chowhub.gh / admin123");
  console.log("User login: ama@example.com / password123");
  console.log("Vendor login: muni@chowhub.gh / password123");

  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
