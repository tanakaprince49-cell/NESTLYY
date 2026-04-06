import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Video } from 'lucide-react';
import { NestComment, MediaAttachment } from '../types.ts';

interface CommentProps {
  comment: NestComment;
  onLike: (commentId: string) => void;
  onReply: (commentId: string, content: string) => void;
  onShare: (commentId: string) => void;
  level?: number;
  isAuthor?: boolean;
  userUid?: string;
}

export const Comment: React.FC<CommentProps> = ({
  comment,
  onLike,
  onReply,
  onShare,
  level = 0,
  isAuthor = false,
  userUid = ''
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const handleLike = () => {
    onLike(comment.id);
  };

  const handleReply = () => {
    setShowReplyForm(true);
  };

  const submitReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyForm(false);
    }
  };

  const handleShare = () => {
    onShare(comment.id);
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div 
      className={`space-y-3 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-slate-100' : ''}`}
      style={{ marginLeft: level > 0 ? `${level * 24}px` : undefined }}
    >
      {/* Comment Header */}
      <div className="flex items-start gap-3">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {comment.authorProfilePicture ? (
            <img
              src={comment.authorProfilePicture}
              alt={comment.authorName}
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800 text-sm">{comment.authorName}</span>
            <span className="text-xs text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          
          {/* Comment Content */}
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Media Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.attachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt="Attachment"
                      className="max-w-sm rounded-xl border border-slate-200 object-cover cursor-pointer hover:border-rose-300 transition-colors"
                      style={{ maxHeight: '200px' }}
                      onClick={() => window.open(attachment.url, '_blank')}
                    />
                  ) : (
                    <div className="relative">
                      <video
                        src={attachment.url}
                        className="max-w-sm rounded-xl border border-slate-200 cursor-pointer"
                        style={{ maxHeight: '200px' }}
                        controls
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                        <Video size={24} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                comment.likedBy.includes(userUid) 
                  ? 'text-rose-500' 
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Heart size={14} fill={comment.likedBy.includes(userUid) ? 'currentColor' : 'none'} />
              <span>{comment.likeCount}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Share2 size={14} />
            </button>

            {isAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <MoreHorizontal size={14} />
                </button>
                
                {showOptionsMenu && (
                  <div className="absolute top-6 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10 min-w-max">
                    <button className="w-full text-left text-sm text-slate-700 hover:bg-slate-50 p-2 rounded">
                      Edit Comment
                    </button>
                    <button className="w-full text-left text-sm text-red-600 hover:bg-red-50 p-2 rounded">
                      Delete Comment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="mt-3 ml-12">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  submitReply();
                }
              }}
            />
            <button
              onClick={submitReply}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => {
                setShowReplyForm(false);
                setReplyContent('');
              }}
              className="px-3 py-2 text-slate-400 hover:text-slate-600 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              onShare={onShare}
              level={level + 1}
              isAuthor={isAuthor}
              userUid={userUid}
            />
          ))}
        </div>
      )}
    </div>
  );
};
