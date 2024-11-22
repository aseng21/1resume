'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getSambaNovaResponse } from '@/lib/sambanova';

export default function SambaNovaDebug() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/sambanova', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response with details
        const errorMessage = data.details 
          ? `Error: ${data.error}\nDetails: ${JSON.stringify(data.details, null, 2)}` 
          : data.error || 'Unknown error occurred';
        
        setResponse(errorMessage);
        throw new Error(errorMessage);
      }

      setResponse(data.response);
    } catch (error) {
      console.error('Error in SambaNova query:', error);
      setResponse(error instanceof Error ? error.message : 'Error querying SambaNova');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 border-gray-200 bg-white mt-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SambaNova Debug</h2>
      <Textarea
        placeholder="Enter a prompt for SambaNova"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[100px] mb-4 border-gray-200 focus:ring-emerald-500"
      />
      <Button 
        onClick={handleQuery} 
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {isLoading ? 'Querying...' : 'Send Query'}
      </Button>
      {response && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </Card>
  );
}
