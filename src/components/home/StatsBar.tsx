interface Props {
  commandCount: number;
  docCount: number;
  postCount: number;
}

export default function StatsBar({ commandCount, docCount, postCount }: Props) {
  const stats = [
    { value: commandCount, label: 'commands', color: '#569CD6' },
    { value: docCount,     label: 'cheat sheets', color: '#4EC9B0' },
    { value: postCount,    label: 'posts', color: '#7D7AF7' },
    { value: null,         label: 'Open Source', color: '#D7BA7D' },
  ];

  return (
    <div className="mx-auto mb-14 max-w-4xl px-4 sm:px-6">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {stats.map(({ value, label, color }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-[#252525] bg-[#171717] px-4 py-2 text-sm"
          >
            {value !== null && (
              <span className="font-bold" style={{ color }}>{value.toLocaleString()}</span>
            )}
            {value === null && (
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            )}
            <span className="text-[#555555]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
