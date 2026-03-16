import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("connection successfull")
    })
    .catch(() => console.log("mongodb connection failure"))
const UserSchema = new mongoose.Schema({ UserName: { type: String, required: true }, PassWord: { type: String, required: true } })
const postSchema = new mongoose.Schema({
    title: { type: String, required: true }, content: { type: String, required: true }, userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

const User = mongoose.model("User", UserSchema)
const Post = mongoose.model("Post", postSchema)
function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader) {
            return res.status(401).json({ message: "no token" })
        }
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.userId
        next()
    }
    catch (err) {
        res.status(401).json({ message: "invalid token" })
    }
}
app.post("/signup", async (req, res) => {
    const { UserName, PassWord } = req.body
    try {
        const hashed = await bcrypt.hash(PassWord, 10)
        await User.create({ UserName: UserName, PassWord: hashed })
        res.json({ message: "sign up successfull" })
    }
    catch (err) {
        res.status(401).json({ message: "sign up failed" })
    }

})

app.post("/signin", async (req, res) => {
    const { UserName, PassWord } = req.body

    try {
      
        const user = await User.findOne({ UserName })
        if (!user) { return res.status(401).json({ message: "user not found" }) }
        const match = await bcrypt.compare(PassWord, user.PassWord)

        if (!match) {
            return res.status(401).json({ message: "invalid password" })
        }
        
        const token = jwt.sign(
            { userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" }
        )
        res.json({ token })
    }
    catch (err) {
        res.status(500).json({ message: "signin failed" })
    }
})
app.post('/savenotes', authMiddleware, async (req, res) => {
    const { title, content } = req.body
    try {
        await Post.create({ title, content, userId: req.userId })
        res.json({ message: "saved successfully" })
    }
    catch (err) {
        res.status(500).json({ message: "failed to save" })
    }


})
app.get("/notes", authMiddleware, async (req, res) => {
    try {
        const { search } = req.query
        if (!search) {
            const notes = await Post.find({ userId: req.userId })
            return res.json(notes)
        }
        const filterNotes = await Post.find({ userId: req.userId, title: { $regex: search, $options: "i" } })
        res.json(filterNotes)
    }
    catch (err) {
        res.status(404).json({ message: "cannot get" })
    }
})
app.get("/viewnotes/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const post = await Post.findOne({
            _id: id, userId: req.userId
        })
        res.json(post)
    }
    catch (err) {
        res.status(404).json({ message: "cannot get notes" })
    }
})
app.delete("/deletenotes/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const deletePost = await Post.findOneAndDelete({
            _id: id, userId: req.userId
        })
        if (!deletePost) {
            return res.status(404).json({ message: "not found " })
        }
        res.status(200).json({ message: "deleted successfully" })
    }
    catch (err) {
        res.status(500).json({ message: "delete failed" })
    }

})
app.put("/updatetitle/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const { title } = req.body
        const updated = await Post.findByIdAndUpdate(id, { title }, { new: true })
        if (!updated) {
            return res.status(404).json({ message: "notes not found" })

        }
        res.status(202).json(updated)

    }
    catch (err) {
        res.status(500)
    }
})
app.put("/updatecontent/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params
        const { content } = req.body
        const updated = await Post.findByIdAndUpdate(id, { content }, { new: true })
        if (!updated) {
            return res.status(404).json({ message: "notes not found" })

        }
        res.status(202).json(updated)
    }
    catch (err) {
        res.status(500)
    }
})
app.delete("/deleteAccount", authMiddleware, async (req, res) => {

    try {
        const userId = req.userId
        await User.findByIdAndDelete(userId)
        await Post.deleteMany({ userId: userId })
        res.json({ message: "account deleted successfully" })
    }
    catch (err) {
        res.status(500).json({ message: "failed" })
    }

})
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log("server listen on :", PORT)
})