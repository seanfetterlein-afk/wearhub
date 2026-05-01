export default function Loading() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-3 w-12 bg-[#EEECE8] rounded" />
        <div className="h-3 w-3 bg-[#EEECE8] rounded" />
        <div className="h-3 w-20 bg-[#EEECE8] rounded" />
        <div className="h-3 w-3 bg-[#EEECE8] rounded" />
        <div className="h-3 w-24 bg-[#EEECE8] rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 xl:gap-16">
        {/* Image skeleton */}
        <div className="aspect-[4/5] bg-[#EEECE8]" />

        {/* Details skeleton */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="h-3 w-20 bg-[#EEECE8] rounded mb-3" />
            <div className="h-8 w-4/5 bg-[#EEECE8] rounded mb-2" />
            <div className="h-6 w-3/5 bg-[#EEECE8] rounded" />
          </div>

          <div className="h-14 w-36 bg-[#EEECE8] rounded" />

          <div className="flex gap-2">
            <div className="h-16 w-24 bg-[#EEECE8] rounded" />
            <div className="h-16 w-24 bg-[#EEECE8] rounded" />
            <div className="h-16 w-24 bg-[#EEECE8] rounded" />
          </div>

          <div className="h-20 bg-[#EEECE8] rounded" />
          <div className="h-12 bg-[#EEECE8] rounded" />
          <div className="h-12 bg-[#EEECE8] rounded" />
          <div className="h-28 bg-[#EEECE8] rounded mt-2" />
        </div>
      </div>
    </div>
  );
}
