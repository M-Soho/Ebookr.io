import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { api, apiError } from "../lib/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("Verifying your email…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React 18 StrictMode double-invoke
    ran.current = true;
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then((res) => {
        setStatus("ok");
        setMessage(res.data.message ?? "Email verified.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(apiError(err));
      });
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div
        className={`rounded-lg border px-3.5 py-2.5 text-sm ${
          status === "ok"
            ? "border-success/30 bg-success/10 text-success"
            : status === "error"
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-line bg-bg-elevated text-ink-secondary"
        }`}
      >
        {message}
      </div>
      <Link to="/login" className="btn-primary mt-6 w-full">
        Continue to sign in
      </Link>
    </AuthLayout>
  );
}
