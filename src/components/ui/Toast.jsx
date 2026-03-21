import toast from 'react-hot-toast';

export function toastSuccess(message) {
  toast.success(message);
}

export function toastError(message) {
  toast.error(message);
}

export function toastAchievement(name, icon) {
  toast(
    () => (
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-xs font-semibold" style={{ color: '#FFD700' }}>Achievement Unlocked!</div>
          <div className="text-sm font-bold">{name}</div>
        </div>
      </div>
    ),
    {
      duration: 4000,
      style: {
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        border: '1px solid #FFD700',
        borderRadius: '8px',
      },
    }
  );
}

export function toastElo(delta) {
  const positive = delta > 0;
  toast(
    `ELO ${positive ? '+' : ''}${delta}`,
    {
      icon: positive ? '📈' : '📉',
      style: {
        background: 'var(--color-surface)',
        color: positive ? 'var(--color-success)' : 'var(--color-error)',
        border: `1px solid ${positive ? 'var(--color-success)' : 'var(--color-error)'}`,
      },
    }
  );
}


export function toastXP(xp, breakdown = {}) {
  if (xp <= 0) return;
  toast(
    () => (
      <div className="flex flex-col gap-1">
        <div className="font-bold whitespace-nowrap flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
          <span>✨</span> +{xp} XP Gained!
        </div>
        {(breakdown.wpmXP > 0 || breakdown.accXP > 0) && (
          <div className="flex gap-2 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
            <span>WPM: +{Math.round(breakdown.wpmXP || 0)}</span>
            <span>Acc: +{Math.round(breakdown.accXP || 0)}</span>
          </div>
        )}
      </div>
    ),
    {
      duration: 3000,
      position: 'top-right',
      style: {
        background: 'var(--color-surface)',
        border: '1px solid var(--color-primary)',
        color: 'var(--color-text)',
      },
    }
  );
}
