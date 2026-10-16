import { Request, Response } from "express";
import Product from "../Model/Product.model";
import Order from "../Model/Order.model"

import mongoose from "mongoose";

// =========================
// CREATE PRODUCT
// =========================

export const createProduct = async (req: Request, res: Response) => {
  const {
    name,
    description,
    brand,
    category,
    images,
    price,
    discountPrice,
    tax,
    stock,
    sku,
    lowStockThreshold,
    specifications,
    tags,
    weight,
    isActive,
    isFeatured,
  } = req.body;

  try {
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      brand,
      category,
      images: images || [],
      price,
      discountPrice,
      tax,
      stock: stock || 0,
      sku: sku.trim(),
      lowStockThreshold: lowStockThreshold || 5,
      specifications: specifications || {},
      tags: tags || [],
      weight,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//get all products

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    // 1. GET LIMIT
    const requestedLimit = Number(req.query.limit) || 8;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    // 2. HANDLE BEST SELLERS
    if (req.query.type === "best-sellers") {
      const bestSellingProducts = await getBestSellers(limit);

      // Fetch product details
      const productIds = bestSellingProducts.map(
        (item: any) => item._id
      );

      const products = await Product.find({
        _id: { $in: productIds },
        isActive: true,
      }).populate("category", "name");

      // Create HashMap using product ID as key
      const productMap = new Map(
        products.map((product) => [
          product._id.toString(),
          product,
        ])
      );

      // Preserve best-seller ranking
      const productsWithSales = bestSellingProducts
        .map((item: any) => {
          const product = productMap.get(item._id.toString());

          if (!product) return null;

          const isOnSale =
            product.discountPrice != null &&
            product.discountPrice < product.price;

          return {
            ...product.toObject(),
            totalSold: item.totalSold,
            isOnSale,
          };
        })
        .filter((product) => product !== null);

      return res.status(200).json({
        success: true,
        count: productsWithSales.length,
        products: productsWithSales,
      });
    }

    // 3. GET QUERY PARAMETERS
    const sort = req.query.sort as string | undefined;
    const cursorId = req.query.cursorId as string | undefined;
    const cursorPrice = req.query.cursorPrice as string | undefined;

    // 4. BUILD BASE QUERY
    const query: any = {};
    const isNewArrivals = req.query.type === "new-arrivals";
    const isTodaysDeals = req.query.type === "todays-deals";

    if (isNewArrivals) {
      Object.assign(query, getNewArrivals());
    }
    if (isTodaysDeals) {
  Object.assign(query, getTodaysDeals());
}

    const search = (req.query.search as string)?.trim();

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // 5. VALIDATE SORT
    if (sort && !["price-asc", "price-desc"].includes(sort)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option",
      });
    }

    const sortOptions: Record<string, 1 | -1> =
      sort === "price-asc"
        ? { price: 1, _id: 1 }
        : sort === "price-desc"
          ? { price: -1, _id: -1 }
          : { _id: 1 };

    // 6. VALIDATE CURSOR
    if (cursorId && !mongoose.isValidObjectId(cursorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor ID",
      });
    }

    // 7. APPLY CURSOR PAGINATION
    if (sort === "price-asc" || sort === "price-desc") {
      if (cursorId && cursorPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: "cursorPrice is required for price sorting",
        });
      }

      if (cursorId && cursorPrice !== undefined) {
        const price = Number(cursorPrice);

        if (!Number.isFinite(price)) {
          return res.status(400).json({
            success: false,
            message: "Invalid cursor price",
          });
        }

        const id = new mongoose.Types.ObjectId(cursorId);
        const operator = sort === "price-asc" ? "$gt" : "$lt";

        query.$or = [
          { price: { [operator]: price } },
          {
            price,
            _id: { [operator]: id },
          },
        ];
      }
    } else if (cursorId) {
      query._id = {
        $gt: new mongoose.Types.ObjectId(cursorId),
      };
    }

    // 8. FETCH PRODUCTS
    const totalProducts = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortOptions)
      .limit(limit + 1)
      .exec();

    // 9. CHECK NEXT PAGE
    const hasNextPage = products.length > limit;

    if (hasNextPage) {
      products.pop();
    }

    // 10. CREATE NEXT CURSOR
    const lastProduct = products[products.length - 1];

    const nextCursor =
      hasNextPage && lastProduct
        ? {
            cursorCreatedAt: lastProduct.createdAt.toISOString(),
            cursorId: lastProduct._id.toString(),
            ...(sort === "price-asc" || sort === "price-desc"
              ? { cursorPrice: lastProduct.price }
              : {}),
          }
        : null;

    // 11. ADD SALE FLAG
    const productsWithSaleStatus = products.map((product) => {
      const isOnSale =
        product.discountPrice != null &&
        product.discountPrice < product.price;

      return {
        ...product.toObject(),
        isOnSale,
      };
    });

    // 12. SEND NORMAL PRODUCTS RESPONSE
    return res.status(200).json({
      success: true,
      count: totalProducts,
      products: productsWithSaleStatus,
      pagination: {
        limit,
        totalPages: Math.ceil(totalProducts / limit),
        hasNextPage,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Get Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =========================
// GET PRODUCT BY ID
// =========================

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id).populate("category", "name");

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// GET RELATED PRODUCTS
// =========================

export const getRelatedProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the current product
    const product = await Product.findById(id);

    // Product not found
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find other active products from the same category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(10);

    return res.status(200).json({
      success: true,
      products: relatedProducts,
    });
  } catch (error) {
    console.error("Get Related Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// =========================
// UPDATE PRODUCT
// =========================

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  const {
    name,
    description,
    brand,
    category,
    images,
    price,
    discountPrice,
    tax,
    stock,
    sku,
    lowStockThreshold,
    specifications,
    tags,
    weight,
    isActive,
    isFeatured,
  } = req.body;

  try {
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    // Update name
    if (name !== undefined) {
      product.name = name.trim();
    }

    // Update description
    if (description !== undefined) {
      product.description = description.trim();
    }

    // Update brand
    if (brand !== undefined) {
      product.brand = brand;
    }

    // Update category
    if (category !== undefined) {
      product.category = category;
    }

    // Update images
    if (images !== undefined) {
      product.images = images;
    }

    // Update price
    if (price !== undefined) {
      product.price = price;
    }

    // Update discount price
    if (discountPrice !== undefined) {
      product.discountPrice = discountPrice;
    }

    // Update tax
    if (tax !== undefined) {
      product.tax = tax;
    }

    // Update stock
    if (stock !== undefined) {
      product.stock = stock;
    }

    // Update SKU
    if (sku !== undefined) {
      product.sku = sku.trim();
    }

    // Update low stock threshold
    if (lowStockThreshold !== undefined) {
      product.lowStockThreshold = lowStockThreshold;
    }

    // Update specifications
    if (specifications !== undefined) {
      product.specifications = specifications;
    }

    // Update tags
    if (tags !== undefined) {
      product.tags = tags;
    }

    // Update weight
    if (weight !== undefined) {
      product.weight = weight;
    }

    // Update active status
    if (isActive !== undefined) {
      product.isActive = isActive;
    }

    // Update featured status
    if (isFeatured !== undefined) {
      product.isFeatured = isFeatured;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =========================
// DELETE PRODUCT
// =========================

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//new arrival
// New Arrivals
export const getNewArrivals = () => {
  const now = new Date();

  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  return {
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  };
};
// best sellers
export const getBestSellers = async (limit: number) => {
  return Order.aggregate([
    {
      $match: {
        orderStatus: "delivered",
      },
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.product",
        totalSold: {
          $sum: "$items.quantity",
        },
      },
    },
    {
      $sort: {
        totalSold: -1,
        _id: 1,
      },
    },
    {
      $limit: limit,
    },
  ]);
};
// Today's Deals
export const getTodaysDeals = () => {
  return {
    isActive: true,
    $expr: {
      $and: [
        { $ne: ["$discountPrice", null] },
        { $lt: ["$discountPrice", "$price"] },
      ],
    },
  };
};
