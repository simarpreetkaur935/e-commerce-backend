import { Request, Response } from "express";
import Product from "../Model/Product.model";
import Category from "../Model/Category.model";

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

  if (!name || !description || !category || !price || !sku) {
    res.status(400).json({
      success: false,
      message:
        "Name, description, category, price and SKU are required",
    });

    return;
  }

  // Check if SKU already exists
  Product.findOne({ sku: sku.trim() })
    .then((existingProduct) => {
      if (existingProduct) {
        res.status(409).json({
          success: false,
          message: "Product with this SKU already exists",
        });

        return null;
      }

      // Check category
      return Category.findById(category);
    })
    .then((categoryData) => {
      if (!categoryData) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        });

        return null;
      }

      return Product.create({
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
    })
    .then((product) => {
      if (!product) {
        return;
      }

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

      // Check duplicate SKU
      if (sku !== undefined) {
        return Product.findOne({
          sku: sku.trim(),
          _id: { $ne: id },
        }).then((existingProduct) => {
          if (existingProduct) {
            res.status(409).json({
              success: false,
              message: "SKU already exists",
            });

            return null;
          }

          product.sku = sku.trim();

          if (name !== undefined) {
            product.name = name.trim();
          }

          if (description !== undefined) {
            product.description = description.trim();
          }

          if (brand !== undefined) {
            product.brand = brand;
          }

          if (category !== undefined) {
            product.category = category;
          }

          if (images !== undefined) {
            product.images = images;
          }

          if (price !== undefined) {
            product.price = price;
          }

          if (discountPrice !== undefined) {
            product.discountPrice = discountPrice;
          }

          if (tax !== undefined) {
            product.tax = tax;
          }

          if (stock !== undefined) {
            product.stock = stock;
          }

          if (lowStockThreshold !== undefined) {
            product.lowStockThreshold = lowStockThreshold;
          }

          if (specifications !== undefined) {
            product.specifications = specifications;
          }

          if (tags !== undefined) {
            product.tags = tags;
          }

          if (weight !== undefined) {
            product.weight = weight;
          }

          if (isActive !== undefined) {
            product.isActive = isActive;
          }

          if (isFeatured !== undefined) {
            product.isFeatured = isFeatured;
          }

          return product.save();
        });
      }

      if (name !== undefined) {
        product.name = name.trim();
      }

      if (description !== undefined) {
        product.description = description.trim();
      }

      if (brand !== undefined) {
        product.brand = brand;
      }

      if (category !== undefined) {
        product.category = category;
      }

      if (images !== undefined) {
        product.images = images;
      }

      if (price !== undefined) {
        product.price = price;
      }

      if (discountPrice !== undefined) {
        product.discountPrice = discountPrice;
      }

      if (tax !== undefined) {
        product.tax = tax;
      }

      if (stock !== undefined) {
        product.stock = stock;
      }

      if (lowStockThreshold !== undefined) {
        product.lowStockThreshold = lowStockThreshold;
      }

      if (specifications !== undefined) {
        product.specifications = specifications;
      }

      if (tags !== undefined) {
        product.tags = tags;
      }

      if (weight !== undefined) {
        product.weight = weight;
      }

      if (isActive !== undefined) {
        product.isActive = isActive;
      }

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