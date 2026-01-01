const mongoose = require('mongoose');
const axios = require('axios');

// Replace with your actual Render URL
const API_URL = "https://poweri-compliance-portal.onrender.com/api/comments";

const dummyPosts = [
    {
        username: "Admin_Sonjoy",
        text: "Welcome to PowerI Community! यहाँ आप CEIG approvals, CSPDCL queries और Electrical Safety Standards (NEC 2023) पर चर्चा कर सकते हैं। Feel free to ask anything!"
    },
    {
        username: "Industrial_Expert_CG",
        text: "Dosto, kya kisi ne naye CEA Regulations 2023 check kiye hain? Factory lighting standards mein kaafi changes aaye hain. If anyone needs the summary, let me know!"
    },
    {
        username: "Safety_Officer_Steel",
        text: "Pro Tip: Steel plants mein Earth Pit maintenance ka schedule har 6 months mein hona chahiye as per IS 3043. Don't wait for the annual audit!"
    }
];

async function seedDatabase() {
    console.log("🌱 Starting to seed Community Hub...");
    for (const post of dummyPosts) {
        try {
            const res = await axios.post(API_URL, post);
            console.log(`✅ Posted: ${post.username}`);
        } catch (err) {
            console.error(`❌ Error seeding ${post.username}:`, err.message);
        }
    }
    console.log("✨ Seeding complete! Check your Community Page.");
}

seedDatabase();
