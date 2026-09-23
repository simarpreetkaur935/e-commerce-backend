import { Request, Response } from "express";
import Product from "../Model/Product.model";



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





// =========================
// GET ALL PRODUCTS
// =========================

export const getAllProducts = async (
  _req: Request,
  res: Response
) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};





// =========================
// GET PRODUCT BY ID
// =========================

export const getProductById = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id)
      .populate("category", "name");

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

export const getRelatedProducts = async (
  req: Request,
  res: Response
) => {
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

export const updateProduct = async (
  req: Request,
  res: Response
) => {
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

export const deleteProduct = async (
  req: Request,
  res: Response
) => {
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

