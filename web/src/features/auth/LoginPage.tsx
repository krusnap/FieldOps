import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { AppRole } from "../../types/domain";
import { demoAccounts, useRoleAccess } from "../../hooks/useRoleAccess";

function validatePasswordPolicy(password: string) {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;

  return {
    valid: hasUppercase && hasLowercase && hasNumber && hasSpecial && hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    hasMinLength,
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useRoleAccess();

  const [email, setEmail] = useState("manager@fieldops.com");
  const [password, setPassword] = useState("Manager@123");
  const [role, setRole] = useState<AppRole>("manager");
  const [credentialsError, setCredentialsError] = useState("");
  const [passwordPolicyError, setPasswordPolicyError] = useState("");

  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCredentialsError("");
    setPasswordPolicyError("");

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      setPasswordPolicyError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    const result = login({ email, password, role });
    if (!result.ok) {
      setCredentialsError(result.message ?? "Invalid credentials.");
      return;
    }
    navigate(`/${role}/dashboard`);
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
              setPasswordPolicyError("");
            }}
            placeholder="Enter your password"
            required
          />
        </label>

        <p className="helper-text">Use 8+ chars with uppercase, lowercase, number, and special character.</p>

        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as AppRole)}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="accountant">Accountant</option>
          </select>
        </label>

        {passwordPolicyError && <p className="error-text">{passwordPolicyError}</p>}
        {credentialsError && <p className="error-text">{credentialsError}</p>}

        <Button type="submit" variant="primary" className="full-width">
          Sign In
        </Button>

        <div className="demo-box">
          <h4>Demo Accounts</h4>
          {demoAccounts.map((account) => (
            <p key={account.email}>
              {account.role}: {account.email} / {account.passwordHint}
            </p>
          ))}
        </div>
      </form>
    </div>
  );
}
