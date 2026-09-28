import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-purple to-cyan shadow-glow">
        <Sparkles size={18} className="text-white" />
      </span>
      <span className="text-lg text-white">
        Inter<span className="text-cyan">Vexa</span>
      </span>
    </Link>
  );
}
