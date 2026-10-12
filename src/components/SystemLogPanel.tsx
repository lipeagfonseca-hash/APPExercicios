type LogEntry = { id: string; tag: string; message: string; createdAt: Date };

export default function SystemLogPanel({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest/85 backdrop-blur-2xl p-6 shadow-md flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-primary-container/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            terminal
          </span>
          <span className="font-display text-headline-sm uppercase text-on-surface tracking-wider">
            System Log
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
      </div>

      <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="font-body text-body-sm text-on-surface-variant">
            Nenhum evento registrado ainda. Complete sua Missão Diária.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded bg-surface-container-low/70 flex flex-col gap-0.5"
            >
              <div className="flex justify-between items-center">
                <span className="font-mono-label text-label-sm text-primary uppercase">
                  [{log.tag}]
                </span>
                <span className="font-mono-label text-label-sm text-on-surface-variant">
                  {log.createdAt.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              <span className="font-body text-body-sm text-on-surface">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
