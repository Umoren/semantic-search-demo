const { MongoClient } = require('mongodb');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function generateEmbedding(text) {
    const embedding = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text,
    });
    return embedding;
}

async function checkVectorIndex() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('sample_supplies');
        const collection = db.collection('sales');

        const indexes = await collection.listSearchIndexes().toArray();
        console.log('Search Indexes:');
        console.log(JSON.stringify(indexes, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

async function checkEmbeddings() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('sample_supplies');
        const collection = db.collection('sales');

        const sampleDocument = await collection.findOne({ "items.0.embedding": { $exists: true } });
        console.log('Sample document with embedding:');
        console.log(JSON.stringify(sampleDocument, null, 2));

        const embeddingCount = await collection.countDocuments({ "items.0.embedding": { $exists: true } });
        console.log(`Number of documents with embeddings: ${embeddingCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}



async function runVectorSearch() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('sample_supplies');
        const collection = db.collection('sales');

        const queryEmbedding = await generateEmbedding('office supplies');
        console.log('Query embedding generated');

        const results = await collection.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "items.0.embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 100,
                    limit: 5
                }
            },
            {
                $project: {
                    _id: 0,
                    firstItemName: { $arrayElemAt: ['$items.name', 0] },
                    score: { $meta: 'vectorSearchScore' }
                }
            }
        ]).toArray();

        console.log('Vector search results:');
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

async function checkEmbeddingStructure() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('sample_supplies');
        const collection = db.collection('sales');

        const sampleDocument = await collection.findOne({ "items.0.embedding": { $exists: true } });
        console.log('Embedding structure:');
        console.log(JSON.stringify(sampleDocument.items[0].embedding, null, 2));
        console.log('Embedding length:', sampleDocument.items[0].embedding.length);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}


async function basicVectorSearch() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('sample_supplies');
        const collection = db.collection('sales');

        // Use a sample embedding from your data
        const sampleDocument = await collection.findOne({ "items.0.embedding": { $exists: true } });
        const sampleEmbedding = sampleDocument.items[0].embedding;

        const results = await collection.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index_items",
                    path: "firstItemEmbedding",
                    queryVector: sampleEmbedding,
                    numCandidates: 30,
                    limit: 5
                }
            }


        ]).toArray();

        console.log('Vector search results:');
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

runVectorSearch().catch(console.error);
// basicVectorSearch().catch(console.error);

// checkEmbeddingStructure().catch(console.error);


// checkVectorIndex().catch(console.error)

// checkEmbeddings().catch(console.error);



