import Link from "next/link";
import Image from "next/image";
import { Home, Search, HeartHandshake } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/90 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shadow-inner">
          <Image
            src="/logo.jpeg"
            alt="Apni Madad Foundation"
            width={56}
            height={56}
            className="rounded-full object-cover"
          />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200/60 uppercase tracking-wider">
            Page Not Found · 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Looking for a Case or Page?
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you requested might have been moved, archived, or is private. Explore verified relief cases or return to the main portal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/cases"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-5 rounded-xl transition shadow-md text-sm"
          >
            <Search className="w-4 h-4" />
            <span>Browse Cases</span>
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <HeartHandshake className="w-4 h-4 text-emerald-600" />
          <span>Apni Madad Foundation · 100% Direct Transparent Aid</span>
        </div>
      </div>
    </div>
  );
}
