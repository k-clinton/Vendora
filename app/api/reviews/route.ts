import { NextResponse } from 'next/server';
import { db, generateId, dateToTimestamp } from '@/lib/db';
import { auth } from '@/lib/auth';

// Get reviews for a product
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(productId);

    // Calculate average rating
    const avgResult = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
      FROM reviews
      WHERE product_id = ?
    `).get(productId) as any;

    return NextResponse.json({
      reviews,
      averageRating: avgResult.avg_rating || 0,
      reviewCount: avgResult.review_count || 0,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// Create a review
export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get user ID
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(session.user.email) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existing = db.prepare(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?'
    ).get(productId, user.id);

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // Create review
    const reviewId = generateId();
    const now = dateToTimestamp(new Date());

    db.prepare(`
      INSERT INTO reviews (id, product_id, user_id, rating, comment, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reviewId, productId, user.id, rating, comment || null, now, now);

    return NextResponse.json({ 
      success: true,
      review: { id: reviewId, rating, comment, created_at: now }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

// Delete a review (user can delete their own)
export async function DELETE(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    // Get user ID
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(session.user.email) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check ownership or admin
    const review = db.prepare('SELECT user_id FROM reviews WHERE id = ?').get(reviewId) as any;
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.user_id !== user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete review
    db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
