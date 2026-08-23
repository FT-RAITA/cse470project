import User from "../models/user.js";
import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    const error = new Error(
      "JWT_SECRET is not configured. Create backend/.env and set JWT_SECRET before starting the server."
    );
    error.code = "AUTH_CONFIG_MISSING";
    throw error;
  }
  return secret;
};

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: "7d",
  });
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// Register
export const registerUser = async (req, res) => {
  try {
    const { name, password, role, phone } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name?.trim() || !email || !password || !role || !phone?.trim()) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      role,
      phone: phone.trim(),
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    const status = error.code === "AUTH_CONFIG_MISSING" ? 503 : 500;
    res.status(status).json({
      message: error.message,
    });
  }
};

// Login
export const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    // Validate authentication configuration before querying a user so a
    // missing JWT secret produces a useful setup error instead of a generic 500.
    const jwtSecret = getJwtSecret();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      token: jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "7d" }),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    const status = error.code === "AUTH_CONFIG_MISSING" ? 503 : 500;
    res.status(status).json({
      message: error.message,
    });
  }
};
