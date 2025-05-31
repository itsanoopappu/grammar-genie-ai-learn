import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Mic, MicOff, Volume2, Bot, User, Lightbulb, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useChatContext } from '@/contexts/ChatContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
    category: string;
  }>;
  suggestions?: string[];
  grammarScore?: number;
}

const ChatInterface = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { 
    chatDisabled,
    setAiResponse
  } = useChatContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognitionAPI();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Initialize chat session
    initializeChatSession();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChatSession = async () => {
    if (!user) return;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setCurrentSessionId(session.id);
      
      await loadChatHistory(session.id);
    } catch (error) {
      console.error('Error initializing chat session:', error);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    if (!sessionId) return;

    try {
      const { data: chatMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (chatMessages && chatMessages.length > 0) {
        const formattedMessages: Message[] = chatMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.message,
          sender: msg.sender as 'user' | 'ai',
          timestamp: new Date(msg.created_at),
          corrections: msg.corrections || [],
          suggestions: msg.metadata?.suggestions || [],
          grammarScore: msg.metadata?.grammarScore
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatMessage = async (message: Message) => {
    if (!currentSessionId) return;

    try {
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        message: message.content,
        sender: message.sender,
        corrections: message.corrections || null,
        metadata: {
          suggestions: message.suggestions || [],
          grammarScore: message.grammarScore || null
        }
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentSessionId || chatDisabled) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    await saveChatMessage(userMessage);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          context: {
            userLevel: profile?.level || 'A1',
            chatHistory: messages.slice(-5).map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content
            })),
            user_id: user?.id
          }
        }
      });

      if (error) throw error;

      // Process AI response through context
      if (data) {
        setAiResponse(data);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        corrections: data.corrections,
        suggestions: data.suggestions,
        grammarScore: data.grammarScore
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      await saveChatMessage(aiMessage);

      // Update user XP if corrections were made
      if (data.corrections?.length > 0 && profile) {
        const xpGain = data.corrections.length * 5;
        await updateProfile({ xp: (profile.xp || 0) + xpGain });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <span>AI Grammar Tutor</span>
          </CardTitle>
          <CardDescription>
            Practice your English with personalized feedback and corrections
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Start a conversation with your AI tutor!</p>
                  <p className="text-sm">Try: "Can you help me with present perfect tense?"</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div className={`flex-1 max-w-[80%] ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.sender === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 text-xs"
                          onClick={() => speakText(message.content)}
                        >
                          <Volume2 className="h-3 w-3 mr-1" />
                          Listen
                        </Button>
                      )}
                    </div>

                    {message.corrections && message.corrections.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <div className="text-sm font-medium text-orange-600">Grammar Corrections:</div>
                        {message.corrections.map((correction, index) => (
                          <div key={index} className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {correction.category}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-red-600 line-through">{correction.original}</span>
                              {' → '}
                              <span className="text-green-600 font-medium">{correction.corrected}</span>
                            </div>
                            <p className="text-gray-600 text-xs mt-1">{correction.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.grammarScore && (
                      <div className="mt-2 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          Grammar Score: {message.grammarScore}%
                        </span>
                      </div>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-sm font-medium text-blue-600 flex items-center space-x-1">
                          <Lightbulb className="h-3 w-3" />
                          <span>Suggestions:</span>
                        </div>
                        {message.suggestions.map((suggestion, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2 text-sm text-blue-800">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or ask for grammar help..."
                disabled={isLoading || chatDisabled}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={isListening ? stopListening : startListening}
                disabled={!recognition || chatDisabled}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading || chatDisabled}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {isListening && (
            <div className="text-center text-sm text-blue-600">
              🎤 Listening... Speak now
            </div>
          )}

          {chatDisabled && (
            <div className="text-center text-sm text-orange-600">
              Chat is disabled while you complete the test.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;