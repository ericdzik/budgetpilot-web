import { cn } from '../../utils/cn'

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
