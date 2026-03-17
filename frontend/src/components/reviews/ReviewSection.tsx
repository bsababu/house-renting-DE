import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';

interface Review {
    id: string;
    rating: number;
    text: string;
    reviewer: {
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

export default function ReviewSection({ targetId, targetType }: { targetId: string, targetType: 'listing' | 'landlord' }) {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState({ average: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [newReview, setNewReview] = useState({ rating: 5, text: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = useCallback(async () => {
        try {
            const data = await authApi.getReviews(targetType, targetId);
            setReviews(data.reviews);
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [targetId, targetType]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert('Please login to leave a review');

        setSubmitting(true);
        try {
            await authApi.createReview({
                targetId,
                targetType,
                rating: newReview.rating,
                text: newReview.text,
            });
            setNewReview({ rating: 5, text: '' });
            fetchReviews();
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl"></div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                Reviews
                <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {stats.count} reviews • {stats.average.toFixed(1)} ★
                </span>
            </h2>

            {/* Review Form */}
            {user && (
                <form onSubmit={handleSubmit} className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Leave a Review</h3>
                    <div className="flex gap-4 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className={`text-2xl transition-transform hover:scale-110 ${star <= newReview.rating ? 'text-yellow-400' : 'text-slate-300'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="w-full p-4 rounded-xl border border-slate-200 mb-4 focus:ring-2 focus:ring-teal-500 outline-none"
                        placeholder="Share your experience..."
                        rows={3}
                        value={newReview.text}
                        onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                        required
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Post Review'}
                    </button>
                </form>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No reviews yet. Be the first!</p>
                )}
                {reviews.map(review => (
                    <div key={review.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                                    {review.reviewer.firstName[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">
                                        {review.reviewer.firstName} {review.reviewer.lastName[0]}.
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex text-yellow-400 text-sm">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed ml-13 pl-13">
                            {review.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
