'use client'

import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from 'lucide-react'

export default function AskAI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ask AI about Your Budget</h2>
      <div className="space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-4 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex space-x-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your budget..."
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send'}
        </Button>
      </form>
    </div>
  )
}

