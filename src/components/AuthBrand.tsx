// Server layout publishes the brand images as CSS variables on <body>
// (--brand-login-bg, --brand-logo, --brand-login-window), so these client-safe
// components just read them and render nothing when no image is configured.
export function AuthBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15,19,29,0.75), rgba(15,19,29,0.9)), var(--brand-login-bg, none)",
      }}
    />
  );
}

export function AuthLogo() {
  return (
    <div
      aria-hidden
      className="mx-auto mb-6 h-32 w-32 bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: "var(--brand-logo, none)" }}
    />
  );
}

// Login/register card: image from the "Janela de login" slot, if any.
export const AUTH_WINDOW_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(15,19,29,0.8), rgba(15,19,29,0.8)), var(--brand-login-window, none)",
  backgroundSize: "cover",
  backgroundPosition: "center",
} as const;
