import { Request, Response } from "express";
import Category from "../Model/Category.model";

// =========================
// CREATE CATEGORY
// =========================

export const createCategory = (req: Request, res: Response) => {
  const {
    name,
    description,
    image,
    parentCategory,
  } = req.body;


  Category.findOne({ name: name.trim() })
    .then((existingCategory) => {
      if (existingCategory) {
        res.status(409).json({
          success: false,
          message: "Category already exists",
        });

        return null;
      }

      if (parentCategory) {
        return Category.findById(parentCategory);
      }

      return null;
    })
    .then((parent) => {
      if (parentCategory && parent === null) {
        res.status(404).json({
          success: false,
          message: "Parent category not found",
        });

        return null;
      }

      return Category.create({
        name: name.trim(),
        description,
        image,
        parentCategory: parentCategory || null,
      });
    })
    .then((category) => {
      if (!category) {
        return;
      }

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
      });
    })
    .catch((error) => {
      console.error("Create Category Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// GET ALL CATEGORIES
// =========================

export const getAllCategories = (
  _req: Request,
  res: Response
) => {
  Category.find()
    .populate("parentCategory", "name")
    .sort({ createdAt: -1 })
    .then((categories) => {
      res.status(200).json({
        success: true,
        count: categories.length,
        categories,
      });
    })
    .catch((error) => {
      console.error("Get Categories Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// GET CATEGORY BY ID
// =========================

export const getCategoryById = (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  Category.findById(id)
    .populate("parentCategory", "name")
    .then((category) => {
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
    })
    .catch((error) => {
      console.error("Get Category Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// UPDATE CATEGORY
// =========================

export const updateCategory = (
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

  Category.findById(id)
    .then((category) => {
      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        });

        return null;
      }

      // Check duplicate category name
      if (name !== undefined) {
        return Category.findOne({
          name: name.trim(),
          _id: { $ne: id },
        }).then((existingCategory) => {
          if (existingCategory) {
            res.status(409).json({
              success: false,
              message: "Category name already exists",
            });

            return null;
          }

          category.name = name.trim();

          if (description !== undefined) {
            category.description = description;
          }

          if (image !== undefined) {
            category.image = image;
          }

          if (parentCategory !== undefined) {
            if (parentCategory === id) {
              res.status(400).json({
                success: false,
                message:
                  "A category cannot be its own parent",
              });

              return null;
            }

            category.parentCategory =
              parentCategory || null;
          }

          if (isActive !== undefined) {
            category.isActive = isActive;
          }

          return category.save();
        });
      }

      if (description !== undefined) {
        category.description = description;
      }

      if (image !== undefined) {
        category.image = image;
      }

      if (parentCategory !== undefined) {
        if (parentCategory === id) {
          res.status(400).json({
            success: false,
            message:
              "A category cannot be its own parent",
          });

          return null;
        }

        category.parentCategory =
          parentCategory || null;
      }

      if (isActive !== undefined) {
        category.isActive = isActive;
      }

      return category.save();
    })
    .then((category) => {
      if (!category) {
        return;
      }

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
      });
    })
    .catch((error) => {
      console.error("Update Category Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};


// =========================
// DELETE CATEGORY
// =========================

export const deleteCategory = (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  Category.findById(id)
    .then((category) => {
      if (!category) {
        res.status(404).json({
          success: false,
          message: "Category not found",
        });

        return null;
      }

      return Category.find({
        parentCategory: id,
      });
    })
    .then((subcategories) => {
      if (!subcategories) {
        return null;
      }

      if (subcategories.length > 0) {
        res.status(400).json({
          success: false,
          message:
            "Cannot delete category because it has subcategories",
        });

        return null;
      }

      return Category.findByIdAndDelete(id);
    })
    .then((deletedCategory) => {
      if (!deletedCategory) {
        return;
      }

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    })
    .catch((error) => {
      console.error("Delete Category Error:", error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    });
};