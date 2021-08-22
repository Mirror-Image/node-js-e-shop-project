const express = require('express')
const {User} = require('../models/user')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.get('/', async (req, res) => {
    const userList = await User
    .find()
    .select('-passwordHash')
    // .select('name phone email')
    // .select('-name -passwordHash')

    if (!userList) {
        res.status(500).json({ success: false })
    }

    res.status(200).send(userList)
})

router.get('/:id', async (req, res) => {
    const user = await User
    .findById(req.params.id)
    .select('-passwordHash')

    if (!user) {
        res.status(500).json({
            message: "The user with the given ID was not found",
            success: false
        })
    }

    res.status(200).send(user)
})

router.post('/', async (req, res) => {
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        naisAdminme: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })

    user = await user.save()

    if (!user) {
        return res.status(400).send('The category cannot be created')
    }

    res.status(200).send(user)
})

router.put('/:id', async (req, res) => {
    const userExist = await User.findById(req.params.id)
    let newPassword

    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true }
    )

    if (!user) {
        return res.status(400).send('The user cannot be updated!')
    }

    res.send(user)
})

router.post('/login', async (req, res) => {
    const user = await User.findOne({
        email: req.body.email
    })

    if (!user) {
        return res.status(400).send("The user not found")
    }
    console.log(bcrypt.compareSync(req.body.password, user.passwordHash))
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            { userId: user.id, isAdmin: user.isAdmin },
            process.env.SECRET,
            { expiresIn: '1d' }
        )

        res.status(200).send({user: user.email, token: token})

    } else {
        res.status(400).send('The password is wrong')
    }
})

router.post('/register', async (req, res) => {
    let user = new User({ ...req.body })

    user = await user.save()

    if (!user) {
        return res.status(400).send('The user cannot be created')
    }

    res.send(user)
})

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({
                success: true,
                message: 'The user is deleted!'
            })
        } else {
            return res.status(404).json({
                success: false,
                message: 'The user was not found'
            })
        }
    }).catch(error => {
        return res.status(500).json({
            success: false,
            error
        })
    })
})

router.get('/get/count', async (req, res) => {
    const userCount = await User.countDocuments(count => count)

    if (!userCount) {
        res.status(500).json({ success: false })
    }

    res.send({ userCount })
})

module.exports = router
