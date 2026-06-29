import Link from "next/link";
import { FileText, Settings } from "./Icons";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          <FileText size={20} />
          <span>合同风险审查</span>
        </Link>
        <Link href="/admin" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <Settings size={16} />
          <span>知识库管理</span>
        </Link>
      </div>
    </nav>
  );
}
