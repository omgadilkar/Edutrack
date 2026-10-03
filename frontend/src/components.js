export function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
}

export function renderAvatar(name) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const color = getAvatarColor(name);
  return `<div class="avatar" style="background-color: ${color};">${initials}</div>`;
}

export function showToast(msg) {
  document.getElementById('toast-msg').textContent = msg;
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

export function renderRadialGauge(score, max_score) {
  const percentage = max_score > 0 ? (score / max_score) * 100 : 0;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const colorClass = percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger';
  
  return `
    <div class="radial-gauge" title="${score} / ${max_score}">
      <svg>
        <circle class="bg" cx="24" cy="24" r="${radius}"></circle>
        <circle class="fg ${colorClass}" cx="24" cy="24" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="value">${Math.round(percentage)}%</div>
    </div>
  `;
}

export function renderEmpty(title, desc) {
  return `
    <div class="empty-state">
      <svg><use href="#icon-empty"></use></svg>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

export function getSkeletonRow() {
  return `
    <tr>
      <td><div class="skeleton" style="height:20px; width:150px;"></div></td>
      <td><div class="skeleton" style="height:20px; width:100px;"></div></td>
      <td><div class="skeleton" style="height:20px; width:80px;"></div></td>
    </tr>
  `;
}
