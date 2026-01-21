import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, generateId, dateToTimestamp } from "@/lib/db";
import { isAdminRole } from "@/lib/permissions";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Check authentication and permissions
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log("[API] Create Product Request:", body); // Debug log

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
      console.error("[API] Missing fields:", { title, price, sku, categoryId });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Prepare data
    const now = dateToTimestamp(new Date());
    const productId = generateId();
    const variantId = generateId();
    const inventoryId = generateId();

    // Clean category ID
    // If user selects 'uncategorized', we might want to store NULL or ensure 'uncategorized' exists.
    // The previous logic was: categoryId === 'uncategorized' ? null : categoryId
    // Let's verify what we are trying to insert.
    let finalCategoryId = categoryId;
    if (finalCategoryId === "uncategorized") {
      finalCategoryId = null; // Assuming products.category_id allows NULL
    }

    console.log("[API] Inserting Product:", {
      productId,
      slug: title,
      categoryId: finalCategoryId,
    });

    try {
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") +
        "-" +
        generateId().slice(-4);

      // 1. Create Product
      db.prepare(
        `
        INSERT INTO products (id, slug, title, description, thumbnail, active, category_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        productId,
        slug,
        title,
        description,
        image,
        1,
        finalCategoryId,
        now,
        now,
      );

      // 2. Create Default Variant
      db.prepare(
        `
        INSERT INTO product_variants (id, product_id, sku, title, price, currency, image, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        variantId,
        productId,
        sku,
        "Default",
        Math.round(parseFloat(price) * 100),
        "usd",
        image,
        1,
        now,
        now,
      );

      // 3. Create Inventory
      db.prepare(
        `
        INSERT INTO inventory (id, variant_id, in_stock, reserved, low_stock_level, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(
        inventoryId,
        variantId,
        parseInt(initialStock) || 0,
        0,
        notifyLowStock ? 10 : null,
        now,
      );
    } catch (dbError: any) {
      console.error("[API] Database Error:", dbError);
      console.error("[API] DB Error Code:", dbError.code);
      if (dbError.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        // Let's debug which key failed.
        // Usually better-sqlite3 doesn't tell us, but we know it's likely category_id.
        console.error(
          `[API] failed foreign key. Trying to insert category_id: ${finalCategoryId}`,
        );
        return NextResponse.json(
          { error: `Invalid Category selected. (ID: ${finalCategoryId})` },
          { status: 400 },
        );
      }
      throw dbError; // Re-throw to be caught by outer catch
    }

    return NextResponse.json({
      success: true,
      productId,
      variantId,
      message: "Product created successfully",
    });
  } catch (error: any) {
    console.error("Create product error:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "A product with this SKU or unique data already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: `Failed to create product: ${error.message}` },
      { status: 500 },
    );
  }
}
