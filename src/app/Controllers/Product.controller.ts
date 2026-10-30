import { Request, Response } from "express";
import Product from "../Model/Product.model";
import Order from "../Model/Order.model";

import mongoose from "mongoose";

// =========================
// CREATE PRODUCT
// =========================

// CREATE PRODUCT
export const createProduct = async (req: Request, res: Response) => {
  try {
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

    if (
      !name?.trim() ||
      !description?.trim() ||
      !sku?.trim() ||
      price === undefined ||
      price === null ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, description, SKU, price and category are required",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      brand,
      category,
      images: images || [],
      price,
      discountPrice,
      tax,
      stock: stock ?? 0,
      sku: sku.trim(),
      lowStockThreshold: lowStockThreshold ?? 5,
      specifications: specifications || {},
      tags: tags || [],
      weight,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//new arrival
export const getNewArrivals = async () => {
  const now = new Date();

  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  return {
    isActive: true,
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  };
};
//best sellers
export const getBestSellers = async () => {
  const bestSellingProducts = await Order.aggregate([
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
  ]);

  return bestSellingProducts;
};
//todays deal
export const getTodaysDeals = (products: any[], isOffer: boolean = false) => {
  const minDiscountPercentage = isOffer ? 20 : 30;

  const updatedProducts = products.filter((product) => {
    console.log("product:", product);

    if (!product.isOnSale) return false;

    const discountPercentage =
      ((product.price - product.discountPrice) / product.price) * 100;

    return discountPercentage >= minDiscountPercentage;
  });

  console.log(updatedProducts);

  return updatedProducts;
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    // 1. GET QUERY PARAMETERS
    const requestedLimit = Number(req.query.limit) || 8;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const type = req.query.type;

    const sortType =
      typeof req.query.sortType === "string" ? req.query.sortType : "price";

    const sortOrder =
      typeof req.query.sortOrder === "string" ? Number(req.query.sortOrder) : 1;

    const cursorId =
      typeof req.query.cursorId === "string" ? req.query.cursorId : undefined;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    // 2. VALIDATE SORT
    const allowedSortFields = ["price", "createdAt", "name"];

    if (!allowedSortFields.includes(sortType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option",
      });
    }

    if (sortOrder !== 1 && sortOrder !== -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort order",
      });
    }

    const sortDirection: 1 | -1 = sortOrder;

    const sortOptions: Record<string, 1 | -1> = {
      [sortType]: sortDirection,
      _id: sortDirection,
    };

    // 3. VALIDATE CURSOR
    if (cursorId && !mongoose.isValidObjectId(cursorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cursor ID",
      });
    }

    // 4. BUILD BASE QUERY
    // 4. BUILD BASE QUERY
    const query: Record<string, any> = {
      isActive: true,
    };

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    // FILTER PRODUCTS BY CATEGORY
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }

      query.category = category;
    }
    // 5. APPLY PRICE CURSOR
    const cursorPrice =
      req.query.cursorPrice !== undefined
        ? Number(req.query.cursorPrice)
        : undefined;

    if (cursorId) {
      if (
        sortType !== "price" ||
        cursorPrice === undefined ||
        !Number.isFinite(cursorPrice)
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid price cursor is required",
        });
      }

      const id = new mongoose.Types.ObjectId(cursorId);
      const operator = sortDirection === 1 ? "$gt" : "$lt";

      query.$or = [
        {
          price: {
            [operator]: cursorPrice,
          },
        },
        {
          price: cursorPrice,
          _id: {
            [operator]: id,
          },
        },
      ];
    }

    // 6. RESULT MAP: SECTION QUERY CONDITIONS
    const result = {
      "new-arrivals": await getNewArrivals(),
    };

    const allowedTypes = [
      "best-sellers",
      "new-arrivals",
      "todays-deals",
      "offers",
    ];

    if (
      type !== undefined &&
      (typeof type !== "string" || !allowedTypes.includes(type))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid operation/type. Try again!",
      });
    }

    // 7. HANDLE BEST-SELLERS SEPARATELY
    if (type === "best-sellers") {
      const bestSellers = await getBestSellers();

      return res.status(200).json({
        success: true,
        count: bestSellers.length,
        products: bestSellers,
      });
    }

    // 8. APPLY SECTION QUERY
    const finalQuery: Record<string, any> =
      type === "new-arrivals"
        ? {
            $and: [query, result["new-arrivals"]],
          }
        : query;

    // 9. COUNT MATCHING PRODUCTS
    const totalProducts = await Product.countDocuments(finalQuery);

    // 10. FETCH MAIN PRODUCT LIST ONCE
    // const fetchedProducts = await Product.find(finalQuery)
    //   .populate("category", "name")
    //   .sort(sortOptions)
    //   .limit(limit + 1)
    //   .exec();

    const isOffer = true
    const minDiscountPercentage = isOffer ? 20 : 30;

    const fetchedProducts = await Product.find({
      ...finalQuery,
      // isOnSale: true,
      price: { $gt: 0 },
      discountPrice: { $ne: null },
      $expr: {
        $gte: [
          {
            $multiply: [
              {
                $divide: [
                  { $subtract: ["$price", "$discountPrice"] },
                  "$price",
                ],
              },
              100,
            ],
          },
          minDiscountPercentage,
        ],
      },
    })
      .populate("category", "name")
      .sort(sortOptions)
      .limit(limit + 1)
      .exec();

    // 11. PAGINATION
    const hasNextPage = fetchedProducts.length > limit;

    const products = hasNextPage
      ? fetchedProducts.slice(0, limit)
      : fetchedProducts;

    const lastProduct = products[products.length - 1];

    const nextCursor =
      hasNextPage && lastProduct
        ? {
            cursorCreatedAt: lastProduct.createdAt.toISOString(),
            cursorId: lastProduct._id.toString(),
            ...(sortType === "price"
              ? {
                  cursorPrice: lastProduct.price,
                }
              : {}),
          }
        : null;

    // 12. CONVERT DOCUMENTS
    // The Mongoose virtual adds isOnSale automatically.
    const productsWithSaleStatus = products.map((product) =>
      product.toObject(),
    );

    // 13. HANDLE DEALS AND OFFERS
    // if (type === "todays-deals" || type === "offers") {
    //   const selectedProducts = getTodaysDeals(
    //     productsWithSaleStatus,
    //     type === "offers",
    //   );

    //   return res.status(200).json({
    //     success: true,
    //     count: selectedProducts.length,
    //     products: selectedProducts,
    //   });
    // }

    // 14. NORMAL PRODUCTS OR NEW ARRIVALS
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
//
// export const getTodaysDeals = async (
//   isDailyRotation: boolean = false,
//   limit: number = 8
// ) => {
//   const products = await Product.find({
//     isActive: true,
//     $expr: {
//       $and: [
//         { $ne: ["$discountPrice", null] },
//         { $lt: ["$discountPrice", "$price"] },
//       ],
//     },
//   }).sort({ _id: 1 });

//   // Apply 24-hour rotation only when requested
//   if (!isDailyRotation || products.length === 0) {
//     return products.slice(0, limit);
//   }

//   const daySlot = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
//   const startIndex = (daySlot * limit) % products.length;

//   const rotatedProducts = [
//     ...products.slice(startIndex),
//     ...products.slice(0, startIndex),
//   ];

//   return rotatedProducts.slice(0, limit);
// };
///

// const products = await Product.find({
//   isActive: true,
//   $expr: {
//     $and: [
//       { $ne: ["$discountPrice", null] },
//       { $lt: ["$discountPrice", "$price"] },
//     ],
//   },
// }).sort({ _id: 1 });

// // Apply 24-hour rotation only when requested
// if (!isDailyRotation || products.length === 0) {
//   return products.slice(0, limit);
// }

// const daySlot = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
// const startIndex = (daySlot * limit) % products.length;

// const rotatedProducts = [
//   ...products.slice(startIndex),
//   ...products.slice(0, startIndex),
// ];

// return rotatedProducts.slice(0, limit);

// Offers
