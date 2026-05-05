import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { AppRole } from "../../types/domain";
import { useRoleAccess } from "../../hooks/useRoleAccess";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading } = useRoleAccess();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("manager");
  const [credentialsError, setCredentialsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>FieldOps</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCredentialsError("");
    setIsSubmitting(true);

    try {
      const result = await login({ email, password, role });
      if (!result.ok) {
        setCredentialsError(result.message ?? "Invalid credentials.");
        setIsSubmitting(false);
        return;
      }
      navigate(`/${role}/dashboard`);
    } catch (error) {
      console.error("Login submission error:", error);
      setCredentialsError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-glow" />
      <form className="login-card" onSubmit={submit}>
        <h1>FieldOps</h1>
        <p>Field Travel Tracking and Reimbursement Management</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setCredentialsError("");
            }}
            placeholder="name@fieldops.com"
            required
            disabled={isSubmitting}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setCredentialsError("");
            }}
            placeholder="Enter your password"
            required
            disabled={isSubmitting}
          />
        </label>

        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as AppRole)} disabled={isSubmitting}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
          </select>
        </label>

        {credentialsError && <p className="error-text">{credentialsError}</p>}

        <Button type="submit" variant="primary" className="full-width" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
