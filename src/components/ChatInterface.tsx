
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MessageCircle, Send, Mic, Volume2, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

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
  tips?: string[];
  difficulty?: number;
  encouragement?: string;
}

const ChatInterface = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'tutor',
      content: `Hello! I'm your AI grammar tutor, specialized in ${profile?.level || 'intermediate'} level English. I'm here to help you improve your grammar, vocabulary, and writing skills. Feel free to:

• Write sentences for me to check
• Ask grammar questions
• Request explanations of grammar rules
• Practice specific topics

What would you like to work on today?`,
      timestamp: new Date(),
      difficulty: 1,
      encouragement: "Let's learn together! 🌟"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setTypingIndicator(true);
    const currentInput = inputValue;
    setInputValue('');

    try {
      // Save user message to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender: 'user',
        message: currentInput
      });

      // Call enhanced AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: currentInput, 
          sessionId,
          userLevel: profile?.level || 'A2'
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        content: data.content,
        timestamp: new Date(),
        corrections: data.corrections || [],
        tips: data.tips || [],
        difficulty: data.difficulty || 1,
        encouragement: data.encouragement
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        sender: 'tutor',
        message: data.content,
        corrections: data.corrections,
        metadata: {
          tips: data.tips,
          difficulty: data.difficulty,
          encouragement: data.encouragement
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'tutor',
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
        difficulty: 1,
        encouragement: "Don't worry, we'll get this sorted out!"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTypingIndicator(false);
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
      };
      
      if (!isListening) {
        recognition.start();
      } else {
        recognition.stop();
      }
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const quickPrompts = [
    "Check this sentence for errors",
    "Explain the difference between present perfect and past simple",
    "Help me with prepositions",
    "What's the rule for using articles?",
    "Practice conditional sentences with me"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Chat Area */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span>AI Grammar Tutor</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {profile?.level || 'A2'} Level
            </Badge>
          </CardTitle>
          <CardDescription>
            Get personalized grammar help and instant feedback on your English
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Area */}
          <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border shadow-sm'
                    }`}
                  >
                    <div className="mb-1">{message.content}</div>
                    
                    {/* Grammar Corrections */}
                    {message.corrections && message.corrections.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center space-x-1 text-sm font-medium text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Grammar Corrections:</span>
                        </div>
                        {message.corrections.map((correction, index) => (
                          <div key={index} className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                            <div className="text-sm">
                              <div className="text-red-600 line-through">{correction.original}</div>
                              <div className="text-green-600 font-medium">{correction.corrected}</div>
                              <div className="text-gray-600 text-xs mt-1">{correction.explanation}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Grammar Tips */}
                    {message.tips && message.tips.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center space-x-1 text-sm font-medium text-yellow-600">
                          <Lightbulb className="h-3 w-3" />
                          <span>Grammar Tips:</span>
                        </div>
                        {message.tips.map((tip, index) => (
                          <div key={index} className="bg-yellow-50 p-2 rounded text-sm text-yellow-800">
                            {tip}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Difficulty and Encouragement */}
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.difficulty && (
                        <div className="flex items-center space-x-1">
                          <span>Difficulty:</span>
                          <Progress value={message.difficulty * 20} className="w-8 h-1" />
                        </div>
                      )}
                    </div>

                    {message.encouragement && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        {message.encouragement}
                      </div>
                    )}
                    
                    {message.sender === 'tutor' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTextToSpeech(message.content)}
                        className="mt-1 h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingIndicator && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message or ask a grammar question..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={loading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              className={isListening ? 'bg-red-100 text-red-600' : ''}
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button onClick={handleSendMessage} disabled={loading || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Features */}
          <div>
            <h4 className="font-medium mb-2">AI Features:</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Grammar Error Detection</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Personalized Explanations</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Level-Appropriate Tips</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Voice Input & Output</span>
              </div>
            </div>
          </div>
          
          {/* Quick Prompts */}
          <div>
            <h4 className="font-medium mb-2">Quick Prompts:</h4>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-left h-auto py-2 px-3"
                  onClick={() => setInputValue(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Current Level Info */}
          {profile && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Your Progress</h4>
              <div className="text-sm space-y-1">
                <div>Level: <span className="font-medium">{profile.level}</span></div>
                <div>XP: <span className="font-medium">{profile.xp}</span></div>
                <div>Streak: <span className="font-medium">{profile.streak} days</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
