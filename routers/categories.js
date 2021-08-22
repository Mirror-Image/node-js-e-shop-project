const express = require('express')
const {Category} = require('../models/category')
const router = express.Router()

router.get('/', async (req, res) => {
    const categoryList = await Category.find()

    if (!categoryList) {
        res.status(500).json({ success: false })
    }

    res.status(200).send(categoryList)
})

router.get('/:id', async (req, res) => {
    const category = await Category.findById(req.params.id)

    if (!category) {
        res.status(404).json({
            message: 'The category with the given ID was not found'
        })
    }

    res.status(200).send(category)
})

router.post('/', async (req, res) => {
    let newCategory = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
    })

    newCategory = await newCategory.save()

    if (!newCategory) {
        return res.status(404).send('The category cannot be created')
    }

    res.send(newCategory)
})

router.put('/:id', async (req, res) => {
    const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        // if you want to receive back already updated data, please pass the option below
        { new: true }
    )

    if (!updatedCategory) {
        return res.status(404).send('The category cannot be updated')
    }

    res.send(updatedCategory)
})

router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id)
        .then(category => {
            if (category) {
                return res.status(200).json({
                    success: true,
                    message: 'The category is deleted!',
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'The category was not found',
                })
            }
        })
        .catch(error => {
            return res.status(400).json({
                success: false,
                error,
            })
        })
})

module.exports = router
