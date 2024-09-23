const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");

        const db = client.db("sample_supplies");
        const collection = db.collection("sales");

        const sampleDocument = await collection.findOne();
        console.log("Sample document:", sampleDocument);

    } finally {
        await client.close();
    }
}

main().catch(console.error);