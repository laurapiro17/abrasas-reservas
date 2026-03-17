import { login } from './actions'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6">
      
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-zinc-500 text-sm">Sign in to manage reservations</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            formAction={login}
            className="w-full bg-brand text-white rounded-xl py-3 font-medium mt-6 hover:bg-brand-hover transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>

    </div>
  )
}
