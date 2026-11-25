import { Request, Response } from "express";

import Order from "../Model/Order.model";

// export const index = async (_req: Request, res: Response) => {
//   try {
//     const paidOrders = await Order.countDocuments({
//       paymentStatus: "paid",
//     });
//     return res.status(200).json({
//         paidOrders,
//         success: true,
//         message: "Paid orders fetched successfully",

//     })
//   } catch (error) {
//     console.log("Get paid orders error:",error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



// // =========================
// // GET TOTAL RETURNED ORDERS
// // =========================

// export const getReturnedOrders = async (_req: Request,res: Response
// ) => {
//   try {
//     const returnedOrders = await Order.countDocuments({
//       orderStatus: "returned",
//     });

//     return res.status(200).json({
//       returnedOrders,
//       success: true,
//       message: "Returned orders fetched successfully",
      
//     });
//   } catch (error) {
//     console.error("Get returned orders error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch returned orders",
//     });
//   }
// };
// //count cancel orders
// export const getCancelledOrders = async (_req:Request, res:Response)=>{
// try{
//     const cancelledOrders = await Order.countDocuments({
//       orderStatus: "cancelled",
//     })
//     return res.status(200).json({
//       cancelledOrders,
//       success: true,
//       message: "Cancelled orders fetched successfully"
//     })

// }catch(error){
//   console.log("Get cancelled orders error:", error);
//   res.status(500).json({
//     success:false,
//     message: "Server error"
//   })
// }

// }


// =========================
// GET GLOBAL ORDER DETAILS
// =========================

export const getGlobalOrderDetails = async ( _req: Request, res: Response) => {
  try {
    const [paidOrders, returnedOrders, cancelledOrders] =
      await Promise.all([
        Order.countDocuments({
          paymentStatus: "paid",
        }),

        Order.countDocuments({
          orderStatus: "returned",
        }),

        Order.countDocuments({
          orderStatus: "cancelled",
        }),
      ]);

    return res.status(200).json({
      success: true,
      message: "Global order details fetched successfully",
    
        paidOrders,
        returnedOrders,
        cancelledOrders,
    });
  } catch (error) {
    console.error("Get global order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch global order details",
    });
  }
};