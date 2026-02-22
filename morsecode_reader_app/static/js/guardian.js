/**
 * guardian.js
 * Light client-side interactivity for Guardian page.
 * NOTE: endpoints are placeholders — adapt to your Django view URLs.
 */

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshBtn');
  const connectedCount = document.getElementById('connectedCount');
  const connectedTable = document.getElementById('connectedTable').querySelector('tbody');
  const searchBtn = document.getElementById('searchBtn');
  const userSearch = document.getElementById('userSearch');
  const applySpecific = document.getElementById('applySpecific');
  const specificUserInput = document.getElementById('specificUserInput');
  const specificAction = document.getElementById('specificAction');

  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.querySelector('.modal-close');
  const modalDisconnect = document.getElementById('modalDisconnect');
  const modalForceLogout = document.getElementById('modalForceLogout');
 







let symbolBuffer = [];
let messageText = "";
let charTimer = null;

const CHAR_GAP_MS = 1200;
const WORD_GAP_MS = 2500;
let lastBlinkTime = 0;















  // helper to fetch and refresh list (replace URL with your API endpoint)
  async function refreshList(){
    try {
      // Example endpoint: /api/guardian/connected_users/
      const res = await fetch('/api/guardian/connected_users/');
      if(!res.ok) throw new Error('Failed to load');

      const data = await res.json();
      // update counts
      connectedCount.textContent = data.connected_count ?? data.users.length ?? 0;
      // rebuild table
      connectedTable.innerHTML = '';
      if((data.users ?? []).length === 0){
        connectedTable.innerHTML = '<tr><td colspan="6" class="empty">No connected users</td></tr>';
        return;
      }

      data.users.forEach(u => {
        const tr = document.createElement('tr');
        tr.dataset.userId = u.id;
        tr.innerHTML = `
          <td>${u.id}</td>
          <td>${u.username}</td>
          <td>${u.ip ?? '-'}${u.location ? ' — ' + u.location : ''}</td>
          <td>${u.connected_since ?? '-'}</td>
          <td class="status">${u.status ?? 'connected'}</td>
          <td class="actions">
            <button class="viewBtn">View</button>
            <button class="disconnectBtn">Disconnect</button>
            <button class="messageBtn">Message</button>
          </td>
        `;
        connectedTable.appendChild(tr);
      });
    } catch(err){
      console.error('Refresh error', err);
    }
  }

  // initial load: if server rendered rows exist, keep them. Optionally call refresh:
  // refreshList();

  // event delegation for table actions
  connectedTable.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr');
    if(!tr) return;
    const uid = tr.dataset.userId;

    if(e.target.classList.contains('viewBtn')){
      // fetch details and show modal
      const res = await fetch(`/api/guardian/user/${uid}/`);
      if(res.ok){
        const data = await res.json();
        showModalForUser(data);
      } else {
        alert('Could not load user details');
      }
    }

    if(e.target.classList.contains('disconnectBtn')){
      if(!confirm('Disconnect this user?')) return;
      const res = await fetch(`/api/guardian/disconnect/${uid}/`, { method:'POST', headers:{'X-CSRFToken': getCookie('csrftoken')}});
      if(res.ok) {
        // optimistic UI
        tr.querySelector('.status').textContent = 'disconnected';
        await refreshList();
      } else alert('Failed to disconnect');
    }

    if(e.target.classList.contains('messageBtn')){
      const message = prompt('Type message to user:');
      if(message) {
        await fetch(`/api/guardian/message/${uid}/`, {
          method:'POST',
          headers:{'Content-Type':'application/json','X-CSRFToken': getCookie('csrftoken')},
          body: JSON.stringify({message})
        });
        alert('Message sent (if backend supports it).');
      }
    }
  });

  // search
  searchBtn.addEventListener('click', async () => {
    const q = userSearch.value.trim();
    if(!q) return alert('Enter username or id');
    // search endpoint example
    const res = await fetch(`/api/guardian/search/?q=${encodeURIComponent(q)}`);
    if(res.ok){
      const data = await res.json();
      // if single user, show details, else rebuild table with results
      if(data.user) showModalForUser(data.user);
      else {
        // replace table with results
        connectedTable.innerHTML = '';
        (data.users || []).forEach(u => {
          const tr = document.createElement('tr');
          tr.dataset.userId = u.id;
          tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td>${u.ip ?? '-'}</td>
            <td>${u.connected_since ?? '-'}</td>
            <td class="status">${u.status ?? 'connected'}</td>
            <td class="actions">
              <button class="viewBtn">View</button>
              <button class="disconnectBtn">Disconnect</button>
              <button class="messageBtn">Message</button>
            </td>
          `;
          connectedTable.appendChild(tr);
        });
      }
    } else alert('Search failed');
  });

  // specific user controls
  applySpecific.addEventListener('click', async () => {
    const identifier = specificUserInput.value.trim();
    const action = specificAction.value;
    if(!identifier) return alert('Enter username or user id');

    if(action === 'view'){
      // attempt to fetch user details
      const res = await fetch(`/api/guardian/find/?q=${encodeURIComponent(identifier)}`);
      if(res.ok){
        const data = await res.json();
        if(data.user) showModalForUser(data.user);
        else alert('User not found');
      } else alert('Request failed');
      return;
    }

    // connect/disconnect (example)
    const endpoint = action === 'connect' ? '/api/guardian/connect/' : '/api/guardian/disconnect/';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers:{ 'Content-Type':'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      body: JSON.stringify({ q: identifier })
    });

    if(res.ok){
      alert(`${action} request sent`);
      await refreshList();
    } else alert('Action failed');
  });

  // refresh button
  refreshBtn.addEventListener('click', refreshList);

  // modal helpers
  function showModalForUser(data){
    modalTitle.textContent = `${data.username} (ID: ${data.id})`;
    modalContent.innerHTML = `
      <p><strong>IP:</strong> ${data.ip ?? '-'}</p>
      <p><strong>Location:</strong> ${data.location ?? '-'}</p>
      <p><strong>Connected since:</strong> ${data.connected_since ?? '-'}</p>
      <p><strong>Status:</strong> ${data.status ?? '-'}</p>
      <pre style="white-space:pre-wrap;margin-top:8px;">${data.extra_info ?? ''}</pre>
    `;
    modal.dataset.currentUser = data.id;
    modal.setAttribute('aria-hidden','false');
  }

  modalClose.addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
  modal.addEventListener('click', e => { if(e.target === modal) modal.setAttribute('aria-hidden','true'); });

  modalDisconnect.addEventListener('click', async () => {
    const uid = modal.dataset.currentUser;
    if(!uid) return;
    if(!confirm('Disconnect this user?')) return;
    const res = await fetch(`/api/guardian/disconnect/${uid}/`, { method:'POST', headers:{'X-CSRFToken': getCookie('csrftoken')}});
    if(res.ok){ alert('Disconnected'); modal.setAttribute('aria-hidden','true'); refreshList(); } else alert('Failed');
  });

  modalForceLogout.addEventListener('click', async () => {
    const uid = modal.dataset.currentUser;
    if(!uid) return;
    if(!confirm('Force logout this user?')) return;
    const res = await fetch(`/api/guardian/forcelogout/${uid}/`, { method:'POST', headers:{'X-CSRFToken': getCookie('csrftoken')}});
    if(res.ok){ alert('Force logout queued'); modal.setAttribute('aria-hidden','true'); refreshList(); } else alert('Failed');
  });

  // small CSRF helper for Django
  function getCookie(name) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
  }

});
document.addEventListener("DOMContentLoaded", () => {

  const refreshBtn = document.getElementById("refreshBtn");

  refreshBtn.addEventListener("click", () => {
    refreshBtn.innerText = "Refreshing...";
    refreshBtn.style.opacity = "0.7";

    setTimeout(() => {
      location.reload();
    }, 800);
  });

});
