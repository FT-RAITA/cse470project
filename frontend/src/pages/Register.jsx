import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiPhone } from "react-icons/fi";

import AuthLayout from "../layouts/AuthLayout";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "family_member", // default selection
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Please enter your name.";
    if (!form.email.trim()) newErrors.email = "Please enter your email.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "That email doesn't look right.";
    if (!form.phone.trim()) newErrors.phone = "Please enter your phone number.";
    if (!form.password) newErrors.password = "Please create a password.";
    else if (form.password.length < 6)
      newErrors.password = "Password should be at least 6 characters.";
    if (form.confirmPassword !== form.password)
      newErrors.confirmPassword = "Passwords don't match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      login(data.user, data.token);
      toast.success("Account created — welcome!");
      navigate(
        data.user?.role === "family_member" ? "/appointments" : "/dashboard"
      );
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Couldn't create your account. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="It only takes a minute to get started"
    >
      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Full Name"
          type="text"
          name="name"
          icon={FiUser}
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Your full name"
        />

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
          label="Phone Number"
          type="tel"
          name="phone"
          icon={FiPhone}
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          placeholder="e.g. 01XXXXXXXXX"
        />

        {/* Role selector */}
        <div className="mb-5">
          <label className="mb-2 block text-base font-semibold text-primary dark:text-ink">
            I am registering as
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "family_member", label: "Family Member" },
              { value: "caregiver", label: "Caregiver" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm({ ...form, role: option.value })}
                className={`rounded-2xl border-2 py-4 text-lg font-semibold transition-colors ${
                  form.role === option.value
                    ? "border-primary bg-primary text-paper-card dark:text-paper"
                    : "border-border bg-paper-card text-primary hover:bg-paper dark:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Admin accounts aren't self-registered; those are set up separately.
          </p>
        </div>

        <InputField
          label="Password"
          type="password"
          name="password"
          icon={FiLock}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="At least 6 characters"
        />

        <InputField
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          icon={FiLock}
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Re-enter your password"
        />

        <div className="mb-6">
          <Button type="submit" loading={loading}>
            Register
          </Button>
        </div>
      </form>

      <p className="text-center text-base text-ink-soft">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-primary hover:underline dark:text-ink"
        >
          Log in here
        </Link>
      </p>
    </AuthLayout>
  );
}
