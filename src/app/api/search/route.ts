import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { HfInference } from '@huggingface/inference'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export async function POST(request: Request) {
    const { query } = await request.json()

    try {
        // Generate embedding for the query
        const embedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: query,
        })

        // Connect to MongoDB
        const client = await MongoClient.connect(process.env.MONGODB_URI as string)
        const db = client.db('sample_supplies')

        // Perform vector search
        const results = await db.collection('sales').aggregate([
            {
                $search: {
                    index: 'default',
                    knnBeta: {
                        vector: embedding,
                        path: 'item_embedding',
                        k: 5,
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    name: '$items.name',
                    score: { $meta: 'searchScore' },
                },
            },
        ]).toArray()

        client.close()

        return NextResponse.json(results)
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred during the search' }, { status: 500 })
    }
}