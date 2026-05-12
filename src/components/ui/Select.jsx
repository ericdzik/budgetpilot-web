import { cn } from '../../utils/cn'

export default function Select({ label, error, options = [], className, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
