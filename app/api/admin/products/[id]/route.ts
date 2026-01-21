import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, dateToTimestamp } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    // Check authentication and permissions
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const productId = params.id;
    const body = await req.json();
    console.log(`[API] Update Product ${productId} Request:`, body);

    const {
      title,
      description,
      price,
      sku,
      categoryId,
      image,
      initialStock,
      notifyLowStock,
    } = body;

    // Validation
    if (!title || !price || !sku || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const now = dateToTimestamp(new Date());

    let finalCategoryId = categoryId;
    if (finalCategoryId === "uncategorized") {
      finalCategoryId = null;
    }

    try {
      // 1. Update Product
      db.prepare(
        `
        UPDATE products 
        SET title = ?, description = ?, thumbnail = ?, category_id = ?, updated_at = ?
        WHERE id = ?
      `,
      ).run(title, description, image, finalCategoryId, now, productId);

      // 2. Update Default Variant
      // Note: This assumes we are updating the "default" variant.
      // A more robust system would pass the variant_id.
      // For now, we find the variant associated with this product.
      const variant = db
        .prepare("SELECT id FROM product_variants WHERE product_id = ? LIMIT 1")
        .get(productId) as any;

      if (variant) {
        const priceInCents = Math.round(parseFloat(price) * 100);

        db.prepare(
          `
           UPDATE product_variants
           SET title = ?, price = ?, sku = ?, image = ?, updated_at = ?
           WHERE id = ?
         `,
        ).run("Default", priceInCents, sku, image, now, variant.id);

        // 3. Update Inventory
        db.prepare(
          `
           UPDATE inventory
           SET in_stock = ?, low_stock_level = ?, updated_at = ?
           WHERE variant_id = ?
         `,
        ).run(
          parseInt(initialStock) || 0,
          notifyLowStock ? 10 : null,
          now,
          variant.id,
        );
      }

      return NextResponse.json({
        success: true,
        message: "Product updated successfully",
      });
    } catch (dbError: any) {
      console.error("[API] Database Update Error:", dbError);
      if (dbError.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return NextResponse.json(
          { error: "SKU must be unique." },
          { status: 409 },
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: `Failed to update product: ${error.message}` },
      { status: 500 },
    );
  }
}
