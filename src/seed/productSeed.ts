import { faker } from "@faker-js/faker";
import mongoose from "mongoose";

interface CategoryInfo {
  _id: mongoose.Types.ObjectId;
  name: string;
}

const brands = [
  "Samsung",
  "Apple",
  "Nike",
  "Adidas",
  "Sony",
  "LG",
  "Puma",
  "Levi's",
  "OnePlus",
  "Boat",
  "Philips",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Canon",
  "Nikon",
  "Amazon Basics",
  "Wildcraft",
  "Roadster",
];

const productTypes = [
  "Premium",
  "Classic",
  "Pro",
  "Ultra",
  "Essential",
  "Advanced",
  "Smart",
  "Elite",
  "Modern",
  "Standard",
];

const colors = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Grey",
  "Silver",
  "Gold",
];

export const generateProducts = (
  categories: CategoryInfo[],
  count: number
) => {
  const products = [];

  for (let i = 0; i < count; i++) {
    // Random category
    const category =
      categories[
        faker.number.int({
          min: 0,
          max: categories.length - 1,
        })
      ];

    // Random brand
    const brand =
      brands[faker.number.int({ min: 0, max: brands.length - 1 })];

    // Random product type
    const type =
      productTypes[
        faker.number.int({
          min: 0,
          max: productTypes.length - 1,
        })
      ];

    // Random color
    const color =
      colors[
        faker.number.int({
          min: 0,
          max: colors.length - 1,
        })
      ];

    // Price
    const price = faker.number.int({
      min: 299,
      max: 99999,
    });

    // Discount
    const discountPercentage = faker.number.int({
      min: 5,
      max: 40,
    });

    const discountPrice = Math.round(
      price - price * (discountPercentage / 100)
    );

    // Reviews - independent
    const totalReviews = faker.number.int({
      min: 0,
      max: 5000,
    });

    // Rating - independent
    const averageRating = Number(
      faker.number
        .float({
          min: 0,
          max: 5,
          fractionDigits: 1,
        })
        .toFixed(1)
    );

    products.push({
      name: `${brand} ${type} ${faker.commerce.productName()}`,

      description: faker.commerce.productDescription(),

      brand,

      category: category._id,

      images: [
        `https://picsum.photos/seed/product-${i}-1/800/800`,
        `https://picsum.photos/seed/product-${i}-2/800/800`,
        `https://picsum.photos/seed/product-${i}-3/800/800`,
      ],

      price,

      discountPrice,

      tax: faker.number.int({
        min: 5,
        max: 18,
      }),

      stock: faker.number.int({
        min: 0,
        max: 500,
      }),

      sku: `SKU-${String(i + 1).padStart(6, "0")}`,

      lowStockThreshold: faker.number.int({
        min: 3,
        max: 15,
      }),

      specifications: {
        color,
        material: faker.commerce.productMaterial(),
        warranty: `${faker.number.int({
          min: 6,
          max: 36,
        })} months`,
      },

      tags: [
        brand.toLowerCase(),
        category.name.toLowerCase(),
        color.toLowerCase(),
        "ecommerce",
      ],

      weight: Number(
        faker.number
          .float({
            min: 0.1,
            max: 15,
            fractionDigits: 2,
          })
          .toFixed(2)
      ),

      averageRating,

      totalReviews,

      isActive: faker.datatype.boolean({
        probability: 0.95,
      }),

      isFeatured: faker.datatype.boolean({
        probability: 0.1,
      }),
    });
  }

  return products;
};