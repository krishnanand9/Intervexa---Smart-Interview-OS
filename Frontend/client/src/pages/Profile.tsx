import { useEffect, useState } from "react";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateName } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  async function save() {
    try {
      await updateName(name);
      setMessage("Profile updated successfully.");
    } catch {
      setMessage("Unable to update profile.");
    }
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-cyan">Account</p>
        <h1 className="mt-1 text-3xl font-black">Profile</h1>

        <div className="mt-8 rounded-2xl border border-white/10 bg-card p-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-purple to-cyan text-xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm text-slate-300">Name</span>
              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  className="pl-10"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </label>

            <label>
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  className="pl-10 opacity-60"
                  value={user?.email || ""}
                  disabled
                />
              </div>
            </label>
          </div>

          <button
            onClick={save}
            className="mt-6 rounded-xl bg-purple px-5 py-3 text-sm font-semibold"
          >
            Save profile
          </button>

          {message && (
            <p className="mt-3 text-sm text-slate-400">{message}</p>
          )}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <ShieldCheck className="text-emerald-400" />
          <div>
            <p className="font-semibold">Authentication protected</p>
            <p className="mt-1 text-sm text-slate-400">
              Your session is connected to the InterVexa Express authentication
              API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
