'use client'

import { useState } from 'react'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    const data = await response.json()
    setResults(data)
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Semantic Search Demo</h1>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Enter your search query"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Search
        </button>
      </form>
      <div>
        {results.map((result: any, index: number) => (
          <div key={index} className="mb-2">
            <p>{result.name}</p>
            <p>Score: {result.score}</p>
          </div>
        ))}
      </div>
    </main>
  )
}