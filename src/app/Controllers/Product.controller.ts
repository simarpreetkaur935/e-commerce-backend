import { Request, Response } from "express";
import Product from "../Model/Product.model";


// =========================
// CREATE PRODUCT
// =========================

export const createProduct = (req: Request, res: Response) => {
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

  Product.create({
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
  })
    .then((product) => {
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product,
      });
    })
    .catch((error) => {
      console.error("Create Product Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// GET ALL PRODUCTS
// =========================

export const getAllProducts = (
  _req: Request,
  res: Response
) => {
  Product.find()
  .limit(10)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .then((products) => {
      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    })
    .catch((error) => {
      console.error("Get Products Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// GET PRODUCT BY ID
// =========================

export const getProductById = (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  Product.findById(id)
    .populate("category", "name")
    .then((product) => {
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
    })
    .catch((error) => {
      console.error("Get Product Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// UPDATE PRODUCT
// =========================

export const updateProduct = (
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

  Product.findById(id)
    .then((product) => {
      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });

        return null;
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

      return product.save();
    })
    .then((product) => {
      if (!product) {
        return;
      }

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product,
      });
    })
    .catch((error) => {
      console.error("Update Product Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};
// =========================
// DELETE PRODUCT
// =========================

export const deleteProduct = (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  Product.findById(id)
    .then((product) => {
      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });

        return null;
      }

      return Product.findByIdAndDelete(id);
    })
    .then((deletedProduct) => {
      if (!deletedProduct) {
        return;
      }

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    })
    .catch((error) => {
      console.error("Delete Product Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};