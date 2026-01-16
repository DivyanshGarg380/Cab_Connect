import express from "express";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User APIs
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Users list
 */
router.get("/", (req, res) => {
  res.json([{ id: 1, name: "Divyansh" }]);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *             required: [name, email]
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ message: "User created", name, email });
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User fetched
 *       404:
 *         description: User not found
 */
router.get("/me", (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ message: "User created", name, email });
});


export default router;
