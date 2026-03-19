import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Trash2, Send, User, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { fetchComments, createComment, deleteComment } from '../api';

// ─── Comment Item ────────────────────────────────────────────────────────────

function CommentItem({ comment, taskOwnerName, onDelete }) {
    const [deleting, setDeleting] = useState(false);
    const [claimName, setClaimName] = useState('');
    const [showDeleteUI, setShowDeleteUI] = useState(false);

    const handleConfirmDelete = async () => {
        const name = claimName.trim();
        if (!name) return;
        setDeleting(true);
        try {
            await onDelete(comment.id, name);
        } finally {
            setDeleting(false);
            setShowDeleteUI(false);
            setClaimName('');
        }
    };

    return (
        <div className="group flex gap-3 py-3 border-b border-gray-100 last:border-0">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-700">
                    {comment.author_name.charAt(0).toUpperCase()}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">{comment.author_name}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(comment.created_at).toLocaleString()}
                    </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.body}</p>

                {/* Delete UI */}
                {showDeleteUI ? (
                    <div className="mt-2 flex items-center gap-2">
                        <Input
                            placeholder={`Your name to confirm (author or "${taskOwnerName}")`}
                            value={claimName}
                            onChange={(e) => setClaimName(e.target.value)}
                            className="h-8 text-xs"
                        />
                        <Button size="sm" variant="destructive" onClick={handleConfirmDelete} isLoading={deleting}>
                            Confirm
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setShowDeleteUI(false); setClaimName(''); }}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowDeleteUI(true)}
                        className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="h-3 w-3" /> Delete
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

export function TaskDetailModal({ task, isOpen, onClose, onCommentDeleted }) {
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentsError, setCommentsError] = useState(null);

    // New comment form state
    const [authorName, setAuthorName] = useState('');
    const [body, setBody] = useState('');
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState(null);

    const loadComments = useCallback(async () => {
        if (!task) return;
        setLoadingComments(true);
        setCommentsError(null);
        try {
            const res = await fetchComments(task.id);
            setComments(res.data);
        } catch (err) {
            setCommentsError(err.response?.data?.error || err.message);
        } finally {
            setLoadingComments(false);
        }
    }, [task]);

    useEffect(() => {
        if (isOpen && task) {
            loadComments();
        }
    }, [isOpen, task, loadComments]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!authorName.trim() || !body.trim()) return;
        setPosting(true);
        setPostError(null);
        try {
            const res = await createComment(task.id, { author_name: authorName.trim(), body: body.trim() });
            setComments((prev) => [...prev, res.data]);
            setBody('');
        } catch (err) {
            setPostError(err.response?.data?.error || err.message);
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async (commentId, claimedName) => {
        try {
            await deleteComment(commentId, claimedName);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            if (onCommentDeleted) onCommentDeleted();
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            alert(`Could not delete: ${msg}`);
        }
    };

    if (!task) return null;

    const statusColors = {
        'New': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Done': 'bg-green-100 text-green-800',
    };
    const priorityColors = {
        'High': 'text-red-600 font-bold',
        'Medium': 'text-yellow-600 font-medium',
        'Low': 'text-gray-500',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Task Details" className="max-w-xl">
            {/* ── Task Summary ── */}
            <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[task.status] || 'bg-gray-100 text-gray-800'}`}>
                        {task.status}
                    </span>
                    <span className={`text-xs uppercase tracking-wider ${priorityColors[task.priority]}`}>
                        {task.priority} Priority
                    </span>
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.createdAt).toLocaleString()}
                    </span>
                </div>

                <p className="text-base font-semibold text-gray-900">{task.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" /> {task.fromName}
                    </span>
                    {task.fromPhone && (
                        <span className="flex items-center gap-1 text-gray-500 text-xs">📞 {task.fromPhone}</span>
                    )}
                    <span className="text-xs text-gray-500">🏷 {task.category}</span>
                </div>

                {task.notes && (
                    <div className="bg-white border border-gray-100 rounded p-2 text-sm text-gray-700">
                        <p className="text-xs text-gray-400 font-semibold mb-1">NOTES</p>
                        {task.notes}
                    </div>
                )}
            </div>

            {/* ── Comments Thread ── */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    Comments
                    <span className="text-gray-400 font-normal">({comments.length})</span>
                </h3>

                {loadingComments ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    </div>
                ) : commentsError ? (
                    <div className="flex items-center gap-2 text-red-600 text-sm py-3">
                        <AlertCircle className="h-4 w-4" />{commentsError}
                    </div>
                ) : comments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-3">No comments yet. Be the first to comment!</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {comments.map((c) => (
                            <CommentItem
                                key={c.id}
                                comment={c}
                                taskOwnerName={task.fromName}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Post Comment Form ── */}
            <form onSubmit={handlePost} className="border-t pt-4 space-y-3">
                <Input
                    label="Your name"
                    placeholder={`e.g. ${task.fromName}`}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                />
                <div className="w-full">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Comment</label>
                    <textarea
                        className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none min-h-[80px]"
                        placeholder="Write a comment…"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                    />
                </div>
                {postError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {postError}
                    </p>
                )}
                <div className="flex justify-end">
                    <Button type="submit" isLoading={posting} disabled={!authorName.trim() || !body.trim()}>
                        <Send className="h-4 w-4 mr-2" /> Post Comment
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
