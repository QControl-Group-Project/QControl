import { Hospital } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Hospital className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">HospitalMS</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
