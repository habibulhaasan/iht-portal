import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import RouteGuard from "../components/RouteGuard";

export const metadata = {
  title: "IHT Rangpur Portal",
  description: "Alumni & student network for Institute of Health Technology, Rangpur",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RouteGuard>{children}</RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
