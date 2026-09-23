import { Request, Response } from "express";
import Category from "../Model/Category.model";


// =========================
// CREATE CATEGORY
// =========================

export const createCategory = async (
  req: Request,
  res: Response
) => {
  const { name, description, image, parentCategory } = req.body;

  try {
    const category = await Category.create({
      name: name.trim(),
      description,
      image,
      parentCategory: parentCategory || null,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =========================
// GET ALL CATEGORIES
// =========================

export const getAllCategories = async (
  _req: Request,
  res: Response
) => {
  try {
    const categories = await Category.find()
      .populate("parentCategory", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// =========================
// GET CATEGORY BY ID
// =========================

export const getCategoryById = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id)
      .populate("parentCategory", "name");

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// =========================
// UPDATE CATEGORY
// =========================

export const updateCategory = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  const {
    name,
    description,
    image,
    parentCategory,
    isActive,
  } = req.body;

  try {
    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });

      return;
    }

    // Update name
    if (name !== undefined) {
      category.name = name.trim();
    }

    // Update description
    if (description !== undefined) {
      category.description = description;
    }

    // Update image
    if (image !== undefined) {
      category.image = image;
    }

    // Update parent category
    if (parentCategory !== undefined) {
      category.parentCategory = parentCategory || null;
    }

    // Update active status
    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// =========================
// DELETE CATEGORY
// =========================

export const deleteCategory = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });

      return;
    }

    const subcategories = await Category.find({
      parentCategory: id,
    });

    if (subcategories.length > 0) {
      res.status(400).json({
        success: false,
        message: "Cannot delete category because it has subcategories",
      });

      return;
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

