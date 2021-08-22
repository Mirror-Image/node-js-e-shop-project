const express = require('express')
const {Category} = require('../models/category')
const {Product} = require('../models/product')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('Invalid image type')

        if (isValid) {
            uploadError = null
        }

        cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname
            // .split(' ').join('-')
            .replace(' ', '-')

        const extension = FILE_TYPE_MAP[file.mimetype]

        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage })

router.get('/', async (req, res) => {
    let filter = {}

    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }


    const productList = await Product.find(filter)
        // .select('name image -_id')
        // .populate('category')

    if (!productList) {
        res.status(500).json({success: false})
    }

    res.send(productList)
})

router.get('/:id', async (req, res) => {
    const product = await Product
        .findById(req.params.id)
        .populate('category')

    if (!product) {
        return res.status(500).json({
            success: false,
            message: "The product was not found"
        })
    }

    res.send(product)
})

router.post('/', uploadOptions.single('image'), async (req, res) => {
    try {
        const category = await Category.findById(req.body.category)

        if (!category) {
            return res.status(404).send('Invalid category')
        }
    } catch(error) {
        return res.status(400).json({
            success: false,
            error,
        })
    }
    const file = req.file

    if (!file) {
        return res.status(400).send('No image in the request')
    }

    const fileName = req.file.filename
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`

    let newProduct = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    newProduct = await newProduct.save()
    
    if (!newProduct) {
        return res.status(400).json({
            message: 'The product cannot be created',
            success: false,
        })
    }

    res.send(newProduct)
})

router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).send('Invalid product id')
    }

    if (req.body.category) {
        try {
            const category = await Category.findById(req.body.category)
    
            if (!category) {
                return res.status(404).send('Invalid category')
            }
        } catch(error) {
            return res.status(400).json({
                success: false,
                error,
            })
        }
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true }
    )

    if (!product) {
        return res.status(404).send("The product cannot be updated")
    }

    res.send(product)
})

router.delete('/:id', (req, res) => {
    Product.findOneAndRemove(req.params.id)
        .then(product => {
            if (product) {
                return res.status(200).json({
                    success: true,
                    message: "The product is deleted!",
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: "The product was not found"
                })
            }
        })
        .catch(error => {
            return res.status(500).json({
                success: false,
                error,
            })
        })
})

router.get('/get/count', async (req, res) => {
    const productCount = await Product.countDocuments(
        // pass a callback to compute some data with return value
        (count) => count
    )

    if (!productCount) {
        return res.status(500).json({ success: false })
    }

    res.send({
        productCount
    })
})

router.get('/get/featured/:count', async (req, res) => {
    // when count equals 0 - response with an error
    const count = req.params.count ? req.params.count : 0

    const featuredProducts = await Product
        .find({isFeatured: true,})
        .limit(Number(count))

    if (!featuredProducts) {
        res.status(500).json({
            success: false
        })
    }

    res.send(featuredProducts)
})

router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid product id')
        }
        
        const files = req.files
        const imagePaths = []
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`

        if (files) {
            files.map(file => {
                imagePaths.push(`${basePath}${file.filename}`)
            })
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { images: imagePaths },
            { new: true }
        )

        if (!product) {
            return res.status(500).send('The product cannot be updated')
        }

        res.send(product)
    }
)

module.exports = router
