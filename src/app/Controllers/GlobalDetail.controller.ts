import { Request, Response } from "express";

import Order from "../Model/Order.model";

export const index = async (req: Request, res: Response) => {
  try {
    const paidOrders = await Order.countDocuments({
      paymentStatus: "paid",
    });
    return res.status(200).json({
        paidOrders

    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const index = async(req:Request, res:Response)=>{
    try {
        const returnOrders = await Order.countDocuments({
            orderStatus: "returned"
        })
    } catch (error) {
        
    }
}