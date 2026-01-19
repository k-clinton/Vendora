'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_name: string;
  user_email: string;
  created_at: number;
}

export function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setReviewCount(data.reviewCount || 0);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: formData.rating,
          comment: formData.comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setFormData({ rating: 5, comment: '' });
      setShowForm(false);
      fetchReviews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await fetch(`/api/reviews?id=${reviewId}`, { method: 'DELETE' });
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const renderStars = (rating: number, interactive = false, onClick?: (rating: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => interactive && onClick?.(star)}
            style={{
              fontSize: '20px',
              cursor: interactive ? 'pointer' : 'default',
              color: star <= rating ? '#ffa500' : '#ddd',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div>Loading reviews...</div>;
  }

  return (
    <div style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ marginBottom: '8px' }}>Customer Reviews</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {renderStars(Math.round(averageRating))}
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {averageRating.toFixed(1)}
            </span>
            <span style={{ color: '#666' }}>
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        {session?.user && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '10px 20px',
              background: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '8px',
            marginBottom: '24px',
            background: '#f9f9f9',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Rating
            </label>
            {renderStars(formData.rating, true, (rating) => setFormData({ ...formData, rating }))}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Comment (optional)
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
              placeholder="Share your thoughts about this product..."
            />
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fee', 
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              background: submitting ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div>
        {reviews.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '20px',
                border: '1px solid #eee',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                    {review.user_name || review.user_email}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(review.created_at * 1000).toLocaleDateString()}
                  </div>
                  {session?.user?.email === review.user_email && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: 'transparent',
                        color: '#c00',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p style={{ color: '#333', lineHeight: '1.6' }}>{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
