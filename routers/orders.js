const express = require('express')
const {Order} = require('../models/order')
const {OrderItem} = require('../models/order-item')
const router = express.Router()

router.get('/', async (req, res) => {
    const orderList = await Order.find()
        .populate('user', 'name')
        // sort from the oldest to newer
        // .sort('dateOrdered')
        // sort form the newest to older
        .sort({'dateOrdered': -1})

    if (!orderList) {
        res.status(500).json({ success: false })
    }

    res.send(orderList)
})

router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        // .populate({ path: 'orderItems', populate: 'product' })
        .populate({
            path: 'orderItems', populate: {
                path: 'product', populate: 'category'
            }
        })


    if (!order) {
        res.status(500).json({ success: false })
    }

    res.send(order)
})

router.post('/', async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(
        async ({ quantity, product }) => {
            let newOrderItem = new OrderItem({ quantity, product })

            newOrderItem = await newOrderItem.save()

            return newOrderItem._id
        }
    ))
    
    const orderIds = await orderItemsIds

    const totalPrices = await Promise.all((await orderItemsIds).map(async orderItemId => {
        const orderItem = await OrderItem.findById(orderItemId)
            .populate('product', 'price')

        const totalPrice = orderItem.product.price * orderItem.quantity

        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((sum, itemTotalPrice) => sum + itemTotalPrice, 0)

    let order = new Order({
        // ...req.body,
        orderItems: orderIds,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        totalPrice,
        user: req.body.user,
    })

    order = await order.save()

    if (!order) {
        return res.status(400).send('The order cannot be created!')
    }

    res.send(order)
})

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
    )

    if (!order) {
        return res.status(400).send('The order cannot be updated')
    }

    res.send(order)
})

router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id)
        .then(async order => {
            if (order) {
                await order.orderItems.map(async orderItem => {
                    await OrderItem.findByIdAndRemove(orderItem)
                })

                return res.status(200).json({
                    success: true,
                    message: 'The order was deleted'
                })

            } else {
                return res.status(404).json({
                    success: false,
                    message: "The order was not found"
                })
            }
        }).catch(error => {
            return res.status(500).json({
                success: false,
                error,
            })
        })
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales: { $sum: `$totalPrice` } } }
    ])

    if (!totalSales) {
        return res.status(400).json('The order sales cannot be generated')
    }

    res.send({ totalSales: totalSales.pop().totalSales })
})

router.get('/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments(count => count)

    if (!orderCount) {
        return res.status(500).json({
            success: false,
            message: 'Something was going wrong'
        })
    }

    res.send({ orderCount })
})

router.get('/get/userorders/:userId', async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.userId })
    .populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered': -1 })

    if (!userOrderList) {
        res.status(500).json({ success: false })
    }

    res.send(userOrderList)
})

module.exports = router
