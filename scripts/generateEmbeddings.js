const { MongoClient } = require('mongodb');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: '.env.local' });

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function generateEmbedding(text) {
    const embedding = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text,
    });
    return embedding;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");

        const db = client.db("sample_supplies");
        const collection = db.collection("sales");

        const cursor = collection.find({}).limit(50);  // Limit to 50 documents
        let count = 0;
        const MAX_ITEMS = 200;

        for await (const doc of cursor) {
            const items = doc.items;
            for (const item of items) {
                if (count >= MAX_ITEMS) {
                    console.log(`Reached limit of ${MAX_ITEMS} items`);
                    return;
                }

                const embedding = await generateEmbedding(item.name);

                await collection.updateOne(
                    { _id: doc._id, "items.name": item.name },
                    { $set: { "firstItemEmbedding": embedding } }
                );

                count++;
                console.log(`Processed item ${count}: ${item.name}`);
            }
        }

        console.log(`Finished processing ${count} items`);

    } finally {
        await client.close();
    }
}

main().catch(console.error);