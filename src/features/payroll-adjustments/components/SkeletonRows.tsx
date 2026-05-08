export function SkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3">
            <div className="h-3.5 w-32 rounded-full bg-zinc-100" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-16 rounded-full bg-zinc-100" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3.5 w-20 rounded-full bg-zinc-100 font-mono" />
          </td>
          <td className="px-4 py-3">
            <div className="h-3.5 w-16 rounded-full bg-zinc-100" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-14 rounded-full bg-zinc-100" />
          </td>
        </tr>
      ))}
    </>
  )
}
