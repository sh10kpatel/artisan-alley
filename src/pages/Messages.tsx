import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Message, Profile, Product, MessageThread } from '@/types/database';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { Send, ArrowLeft, User, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toId = searchParams.get('to');
  const productId = searchParams.get('product');

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch threads
  useEffect(() => {
    if (!profile) return;

    const fetchThreads = async () => {
      // Get all messages where user is sender or recipient
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*),
          product:products(*)
        `)
        .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      // Group by peer and product
      const threadMap = new Map<string, MessageThread>();
      
      (messagesData as any[]).forEach((msg) => {
        const peer = msg.sender_id === profile.id ? msg.recipient : msg.sender;
        const key = `${peer.id}-${msg.product_id || 'general'}`;
        
        if (!threadMap.has(key)) {
          threadMap.set(key, {
            peer,
            product: msg.product,
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        
        if (!msg.is_read && msg.recipient_id === profile.id) {
          const thread = threadMap.get(key)!;
          thread.unreadCount++;
        }
      });

      setThreads(Array.from(threadMap.values()));
      setLoading(false);

      // If we have toId in URL, select or create that thread
      if (toId) {
        const existingThread = Array.from(threadMap.values()).find(
          (t) => t.peer.id === toId && (productId ? t.product?.id === productId : !t.product)
        );
        
        if (existingThread) {
          setSelectedThread(existingThread);
        } else {
          // Fetch the peer profile
          const { data: peerData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', toId)
            .maybeSingle();

          let productData = null;
          if (productId) {
            const { data } = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .maybeSingle();
            productData = data;
          }

          if (peerData) {
            setSelectedThread({
              peer: peerData as Profile,
              product: productData as Product | null,
              lastMessage: null as any,
              unreadCount: 0,
            });
          }
        }
      }
    };

    fetchThreads();
  }, [profile, toId, productId]);

  // Fetch messages for selected thread
  useEffect(() => {
    if (!profile || !selectedThread) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*)
        `)
        .or(`and(sender_id.eq.${profile.id},recipient_id.eq.${selectedThread.peer.id}),and(sender_id.eq.${selectedThread.peer.id},recipient_id.eq.${profile.id})`)
        .order('created_at', { ascending: true });

      if (selectedThread.product) {
        query = query.eq('product_id', selectedThread.product.id);
      } else {
        query = query.is('product_id', null);
      }

      const { data, error } = await query;

      if (!error && data) {
        setMessages(data as Message[]);
        
        // Mark messages as read
        const unreadIds = (data as Message[])
          .filter((m) => !m.is_read && m.recipient_id === profile.id)
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds);
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Check if this message belongs to current thread
          const belongsToThread = 
            (newMsg.sender_id === profile.id || newMsg.sender_id === selectedThread.peer.id) &&
            (newMsg.recipient_id === profile.id || newMsg.recipient_id === selectedThread.peer.id);

          if (belongsToThread) {
            // Fetch the full message with relations
            const { data } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(*),
                recipient:profiles!messages_recipient_id_fkey(*)
              `)
              .eq('id', newMsg.id)
              .single();

            if (data) {
              setMessages((prev) => [...prev, data as Message]);
              
              // Mark as read if we're the recipient
              if (newMsg.recipient_id === profile.id) {
                await supabase
                  .from('messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, selectedThread]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedThread || !newMessage.trim()) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: profile.id,
      recipient_id: selectedThread.peer.id,
      product_id: selectedThread.product?.id || null,
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: profile,
      recipient: selectedThread.peer,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const { error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      recipient_id: selectedThread.peer.id,
      product_id: selectedThread.product?.id || null,
      content: messageText,
    });

    if (error) {
      // Revert optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(messageText);
      toast({
        title: 'Failed to send',
        description: error.message,
        variant: 'destructive',
      });
    }

    setSending(false);
  };

  if (!user) {
    navigate('/login?redirect=/messages');
    return null;
  }

  return (
    <Layout showFooter={false}>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Thread List */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedThread ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No messages yet</p>
                <p className="text-sm mt-1">Start a conversation by messaging a seller</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={`${thread.peer.id}-${thread.product?.id || 'general'}`}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 text-left border-b border-border hover:bg-secondary/50 transition-colors ${
                    selectedThread?.peer.id === thread.peer.id && 
                    selectedThread?.product?.id === thread.product?.id
                      ? 'bg-secondary'
                      : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {thread.peer.avatar_url ? (
                        <img 
                          src={thread.peer.avatar_url} 
                          alt="" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-foreground truncate">
                          {thread.peer.display_name || thread.peer.username}
                        </p>
                        {thread.unreadCount > 0 && (
                          <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                      {thread.product && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Package className="h-3 w-3" />
                          {truncate(thread.product.title, 20)}
                        </p>
                      )}
                      {thread.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {truncate(thread.lastMessage.content, 30)}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message View */}
        <div className={`flex-1 flex flex-col ${!selectedThread ? 'hidden md:flex' : 'flex'}`}>
          {selectedThread ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedThread(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Link 
                  to={`/shop/${selectedThread.peer.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {selectedThread.peer.avatar_url ? (
                      <img 
                        src={selectedThread.peer.avatar_url} 
                        alt="" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedThread.peer.display_name || selectedThread.peer.username}
                    </p>
                    {selectedThread.product && (
                      <p className="text-xs text-muted-foreground">
                        Re: {selectedThread.product.title}
                      </p>
                    )}
                  </div>
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === profile?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary text-secondary-foreground rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatRelativeTime(msg.created_at)}
                          {isOwn && msg.is_read && ' · Read'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 artisan-input"
                    disabled={sending}
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sending}>
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <span className="text-6xl mb-4 block">💬</span>
                <p>Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
