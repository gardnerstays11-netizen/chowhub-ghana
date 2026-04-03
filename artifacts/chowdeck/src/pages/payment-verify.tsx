import { useEffect, useState } from "react";
import { useVerifyPayment } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function PaymentVerifyPage() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get("reference") || params.get("trxref") || "";
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "error">("loading");
  const [details, setDetails] = useState<any>(null);

  const verifyMut = useVerifyPayment(reference, { query: { enabled: !!reference } } as any);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      return;
    }

    if (verifyMut.data) {
      const d = verifyMut.data as any;
      setDetails(d);
      setStatus(d.status === "success" ? "success" : "failed");
    } else if (verifyMut.isError) {
      setStatus("error");
    }
  }, [reference, verifyMut.data, verifyMut.isError]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f7f5f1", fontFamily: "Inter, sans-serif" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 40, maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        {status === "loading" && (
          <>
            <div style={{ width: 48, height: 48, border: "4px solid #e5e5e5", borderTopColor: "#24503a", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
            <h2 style={{ color: "#24503a", fontSize: 20, margin: 0 }}>Verifying Payment...</h2>
            <p style={{ color: "#666", marginTop: 8 }}>Please wait while we confirm your payment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              ✓
            </div>
            <h2 style={{ color: "#24503a", fontSize: 22, margin: 0 }}>Payment Successful!</h2>
            <p style={{ color: "#666", marginTop: 8 }}>
              Your payment of <strong>GHS {details?.amount?.toFixed(2)}</strong> has been confirmed.
            </p>
            {details?.paymentType === "order" && (
              <p style={{ color: "#666", fontSize: 14 }}>Your order is now being processed by the restaurant.</p>
            )}
            {details?.paymentType === "subscription" && (
              <p style={{ color: "#666", fontSize: 14 }}>Your subscription has been activated successfully.</p>
            )}
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/" style={{ padding: "10px 20px", backgroundColor: "#24503a", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                Go Home
              </Link>
              <Link href="/dashboard" style={{ padding: "10px 20px", backgroundColor: "#f1f1f1", color: "#333", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                My Dashboard
              </Link>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              ✗
            </div>
            <h2 style={{ color: "#b91c1c", fontSize: 22, margin: 0 }}>Payment Failed</h2>
            <p style={{ color: "#666", marginTop: 8 }}>
              Your payment could not be completed. Please try again.
            </p>
            <Link href="/" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", backgroundColor: "#24503a", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              Try Again
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
              !
            </div>
            <h2 style={{ color: "#92400e", fontSize: 22, margin: 0 }}>Verification Error</h2>
            <p style={{ color: "#666", marginTop: 8 }}>
              We couldn't verify this payment. Please contact support if you were charged.
            </p>
            <Link href="/" style={{ display: "inline-block", marginTop: 20, padding: "10px 24px", backgroundColor: "#24503a", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              Go Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
