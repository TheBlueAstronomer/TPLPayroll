export function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="h-3 w-20 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-40 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-24 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3 w-24 rounded skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 rounded-full skeleton-shimmer" />
          </td>
        </tr>
      ))}
    </>
  )
}
