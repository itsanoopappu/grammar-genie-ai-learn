
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Mic, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  content: string;
  timestamp: Date;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
}

const ChatInterface = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'tutor',
      content: "Hello! I'm your AI grammar tutor. I'm here to help you improve your English grammar and vocabulary. Feel free to ask me questions or write sentences for me to review!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      createChatSession();
    }
  }, [user]);

  const createChatSession = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user?.id })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error) {
      console.error('Error creating chat session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInputValue('');

    try {
      // Save user message to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender: 'user',
        message: inputValue
      });

      // Call AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: inputValue, sessionId }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        content: data.content,
        timestamp: new Date(),
        corrections: data.corrections || []
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender: 'tutor',
        message: data.content,
        corrections: data.corrections
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        content: "I'm sorry, I'm having trouble right now. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice input implementation would go here
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Chat Area */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <span>AI Grammar Tutor</span>
          </CardTitle>
          <CardDescription>
            Practice grammar and get instant feedback from your AI tutor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Area */}
          <ScrollArea className="h-96 w-full border rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="mb-1">{message.content}</div>
                    
                    {/* Grammar Corrections */}
                    {message.corrections && message.corrections.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.corrections.map((correction, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-red-400">
                            <div className="text-sm">
                              <div className="text-red-600 line-through">{correction.original}</div>
                              <div className="text-green-600 font-medium">{correction.corrected}</div>
                              <div className="text-gray-600 text-xs mt-1">{correction.explanation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                    
                    {message.sender === 'tutor' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTextToSpeech(message.content)}
                        className="mt-1 h-6 w-6 p-0"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="text-sm text-gray-500">AI is typing...</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message or question here..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={loading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              className={isListening ? 'bg-red-100 text-red-600' : ''}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button onClick={handleSendMessage} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat Features Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">What I can help with:</h4>
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">Grammar Check</Badge>
              <Badge variant="outline" className="w-full justify-center">Vocabulary Help</Badge>
              <Badge variant="outline" className="w-full justify-center">Sentence Structure</Badge>
              <Badge variant="outline" className="w-full justify-center">Pronunciation</Badge>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Quick Prompts:</h4>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("Can you check this sentence for errors?")}
              >
                Check my grammar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("What's the difference between...")}
              >
                Explain the difference
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => setInputValue("How do I use...")}
              >
                How to use...
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
