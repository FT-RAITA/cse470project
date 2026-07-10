import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiMail, FiLock } from "react-icons/fi";

import AuthLayout from "../layouts/AuthLayout";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Please enter your email.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "That email doesn't look right.";
    if (!form.password) newErrors.password = "Please enter your password.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await loginUser(form);
      login(data.user, data.token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Couldn't log you in. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Log in to continue to your dashboard"
    >
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Email"
          type="email"
          name="email"
          icon={FiMail}
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
        />

        <InputField
          label="Password"
          type="password"
          name="password"
          icon={FiLock}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
        />

        <div className="mb-6">
          <Button type="submit" loading={loading}>
            Log In
          </Button>
        </div>
      </form>

      <p className="text-center text-base text-gray-500">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-[#4F8A8B] font-semibold hover:underline"
        >
          Register here
        </Link>
      </p>
    </AuthLayout>
  );
}
