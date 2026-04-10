import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Tag, Clock, User, Hash, ChevronRight, CornerDownRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Comment {
  id: string;
  thread_id: string;
  parent_id: string | null;
  content: string;
  author: string;
  timestamp: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  tags: string[];
  comments: Comment[];
}

const Vortex: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewThread, setShowNewThread] = useState(false);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);

  // New Thread Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // New Comment Form
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const availableTags = ['analysis', 'Data', 'Astronomy', 'Photography', 'Discovery', 'ML'];

  const fetchThreads = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/forum/threads`);
      const data = await res.json();
      setThreads(data);
    } catch (e) {
      console.error("Failed to fetch threads", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/forum/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          tags: selectedTags,
          author: `Anon#${Math.floor(1000 + Math.random() * 9000)}`
        }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setSelectedTags([]);
        setShowNewThread(false);
        fetchThreads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !activeThread) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/forum/threads/${activeThread.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parent_id: replyTo,
          author: `Anon#${Math.floor(1000 + Math.random() * 9000)}`
        }),
      });
      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        fetchThreads();
        // Refresh active thread to show new comment
        const updatedThreadsRes = await fetch(`${import.meta.env.VITE_CATALOG_URL || 'http://localhost:8000'}/api/forum/threads`);
        const updatedThreads = await updatedThreadsRes.json();
        const updated = updatedThreads.find((t: Thread) => t.id === activeThread.id);
        if (updated) setActiveThread(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderComments = (parentId: string | null, depth = 0) => {
    if (!activeThread) return null;
    const filtered = activeThread.comments.filter(c => c.parent_id === parentId);

    return filtered.map(comment => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 border-l border-white/10 pl-4 mt-3' : 'mt-4 bg-white/5 p-4 rounded-sm'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[13px] font-mono text-cyan-400 uppercase tracking-tighter bg-cyan-400/10 px-1.5 py-0.5">{comment.author}</span>
          <span className="text-[12px] font-mono text-outline uppercase">{formatTime(comment.timestamp)}</span>
          <span className="text-[12px] font-mono text-outline/40">ID: {comment.id}</span>
          <button
            onClick={() => setReplyTo(comment.id)}
            className="ml-auto text-[12px] font-mono uppercase text-primary hover:underline"
          >
            Reply
          </button>
        </div>
        <p className="text-sm text-white/90 font-sans leading-relaxed">{comment.content}</p>
        {renderComments(comment.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-primary/20 pb-4">
        <div>
          <h2 className="font-headline text-2xl font-black text-primary uppercase tracking-tighter flex items-center gap-2">
            <Hash className="w-6 h-6" />
            Vortex <span className="text-outline font-light font-mono text-xs ml-2 tracking-widest">v1.0-ALFA</span>
          </h2>
          <p className="text-[13px] font-mono text-outline uppercase mt-1">Anonymous Collaborative Space-Data Discussion Board</p>
        </div>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="bg-primary text-black font-headline font-bold text-xs uppercase tracking-widest px-6 py-2.5 hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Broadcast Transmission
        </button>
      </div>

      <AnimatePresence>
        {showNewThread && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-surface-container/50 backdrop-blur-md border border-primary/20 p-6"
          >
            <form onSubmit={handleCreateThread} className="space-y-4">
              <input
                type="text"
                placeholder="Transmission Subject..."
                className="w-full bg-background/50 border border-white/10 text-white px-4 py-3 font-mono text-sm focus:border-primary outline-none"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
              <textarea
                placeholder="Encrypted Message Content..."
                className="w-full bg-background/50 border border-white/10 text-white px-4 py-3 font-mono text-sm focus:border-primary outline-none h-32 resize-none"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 font-mono text-[12px] uppercase border transition-all ${selectedTags.includes(tag) ? 'bg-primary border-primary text-black' : 'border-white/10 text-outline hover:border-primary/50'
                      }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full bg-primary text-black font-headline font-bold text-xs uppercase tracking-widest py-3 hover:brightness-110">
                Execute Broadcast
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {threads.map(thread => (
          <motion.div
            key={thread.id}
            layoutId={thread.id}
            onClick={() => setActiveThread(thread)}
            className="bg-surface/90 border border-white/5 p-5 hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-mono text-primary font-bold uppercase tracking-tighter px-1.5 py-0.5 bg-primary/10">
                  {thread.author}
                </span>
                <span className="text-[12px] font-mono text-outline uppercase">{formatTime(thread.timestamp)}</span>
              </div>
              <div className="text-[12px] font-mono text-outline/30">ID:{thread.id}</div>
            </div>

            <h3 className="font-headline font-bold text-white group-hover:text-primary transition-colors text-lg line-clamp-1 mb-2">
              {thread.title}
            </h3>

            <p className="text-xs text-outline line-clamp-3 mb-4 font-sans leading-relaxed">
              {thread.content}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              {thread.tags.map(tag => (
                <span key={tag} className="text-[11px] font-mono uppercase text-primary/70">#{tag}</span>
              ))}
              <div className="ml-auto flex items-center gap-1 text-[12px] font-mono text-outline uppercase tracking-widest">
                <MessageSquare className="w-3 h-3" />
                {thread.comments.length} REPLIES
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Modal View for Thread */}
      <AnimatePresence>
        {activeThread && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveThread(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-background/50 border border-white/10 flex flex-col shadow-2xl vortex-modal"
            >
              <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono text-primary font-black uppercase tracking-widest px-2 py-1 bg-primary/10">
                      {activeThread.author}
                    </span>
                    <span className="text-xs font-mono text-outline uppercase">{formatTime(activeThread.timestamp)}</span>
                    <span className="text-xs font-mono text-outline/30">THREAD_ID: {activeThread.id}</span>
                  </div>
                  <h3 className="font-headline text-3xl font-black text-white uppercase tracking-tighter leading-none">
                    {activeThread.title}
                  </h3>
                </div>
                <button onClick={() => setActiveThread(null)} className="text-outline hover:text-white">
                  <Plus className="w-8 h-8 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                <div className="bg-white/5 p-6 border-l-2 border-primary">
                  <p className="text-white/90 text-lg font-sans leading-relaxed whitespace-pre-wrap">
                    {activeThread.content}
                  </p>
                  <div className="flex gap-3 mt-6">
                    {activeThread.tags.map(tag => (
                      <span key={tag} className="text-xs font-mono text-primary uppercase">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-headline text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                    <CornerDownRight className="w-4 h-4 text-primary" />
                    Transmission Replies ({activeThread.comments.length})
                  </h4>

                  <div className="space-y-4">
                    {renderComments(null)}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container/30 border-t border-white/10">
                <form onSubmit={handleCreateComment} className="space-y-3">
                  {replyTo && (
                    <div className="flex items-center justify-between bg-primary/10 px-3 py-1.5 border-l-2 border-primary">
                      <span className="text-[13px] font-mono text-primary uppercase">Replying to ID: {replyTo}</span>
                      <button type="button" onClick={() => setReplyTo(null)} className="text-[13px] uppercase text-outline underline">Cancel</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter anonymous response..."
                      className="flex-1 bg-black/40 border border-white/10 text-white px-4 py-3 font-mono text-xs focus:border-primary outline-none"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="bg-primary text-black px-6 py-3 hover:brightness-110 transition-all scale-100 active:scale-95">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(208, 0, 255, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(208, 0, 255, 0.5); }
      `}</style>
    </div>
  );
};

export default Vortex;
