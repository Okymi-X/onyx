interface Props {
  commandCount: number;
  docCount: number;
  postCount: number;
}

export default function StatsBar({ commandCount, docCount, postCount }: Props) {
  const stats = [
    { value: commandCount, label: 'commands' },
    { value: docCount, label: 'cheat sheets' },
    { value: postCount, label: 'posts' },
    { value: null, label: 'Open Source' },
  ];

  return (
    <div className="mx-auto mb-12 max-w-4xl px-4 sm:px-6">
      <div className="flex flex-wrap gap-2">
        {stats.map(({ value, label }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-sm"
          >
            {value !== null && (
              <span className="font-semibold text-white">{value}</span>
            )}
            <span className="text-[#6b6b6b]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
