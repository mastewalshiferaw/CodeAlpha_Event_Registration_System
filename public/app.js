const API_URL = '/api';
let allEvents = [];
let currentFilter = 'ALL';
let searchQuery = '';
let currentUser = null;

// ==========================================
// 🔐 AUTH & RBAC STATE MANAGEMENT
// ==========================================
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

function renderAuthNavbar() {
  const container = document.getElementById('authNavSection');
  const token = getAuthToken();
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null');

  if (token && user) {
    currentUser = user;
    const roleBadge = user.role === 'ADMIN' 
      ? '🛡️ ADMIN' 
      : user.role === 'ORGANIZER' 
      ? '👑 ORGANIZER' 
      : '🎟️ ATTENDEE';

    container.innerHTML = `
      <div class="flex items-center gap-2">
        ${user.role === 'ADMIN' ? `
          <button onclick="openAdminModal()" class="text-xs font-bold px-3 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1 shadow-sm">
            <span>🛡️</span> Admin Hub
          </button>
        ` : ''}

        ${['ORGANIZER', 'ADMIN'].includes(user.role) ? `
          <button onclick="openCreateModal()" class="text-xs font-semibold px-4 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-sm">
            <span>+</span> Create Event
          </button>
        ` : ''}

        <div class="flex items-center gap-2 pl-2 border-l border-zinc-300 dark:border-zinc-700">
          <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">${roleBadge} &bull; ${user.name.split(' ')[0]}</span>
          <button onclick="handleLogout()" class="text-[11px] font-mono text-zinc-400 hover:text-red-500 transition">Logout</button>
        </div>
      </div>
    `;
  } else {
    currentUser = null;
    container.innerHTML = `
      <button onclick="openAuthModal('login')" class="text-xs font-semibold px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm">
        Sign In / Portal
      </button>
    `;
  }
}

function openAuthModal(tab = 'login') {
  document.getElementById('authModal').classList.remove('hidden');
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.className = 'text-sm font-bold pb-1 border-b-2 border-indigo-600 text-zinc-900 dark:text-white transition';
    tabRegister.className = 'text-sm font-medium pb-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition';
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabRegister.className = 'text-sm font-bold pb-1 border-b-2 border-indigo-600 text-zinc-900 dark:text-white transition';
    tabLogin.className = 'text-sm font-medium pb-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));

    alert(`✅ ${data.message} Logged in as [${data.user.role}]`);
    closeAuthModal();
    renderAuthNavbar();
    fetchEvents();
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const role = document.getElementById('signRole').value;
  const name = document.getElementById('signName').value;
  const organization = document.getElementById('signOrg').value;
  const email = document.getElementById('signEmail').value;
  const password = document.getElementById('signPassword').value;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, organization, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));

    alert(`🎉 Account created with role: [${data.user.role}]`);
    closeAuthModal();
    renderAuthNavbar();
    fetchEvents();
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}

function handleLogout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  renderAuthNavbar();
  fetchEvents();
}

// ==========================================
// 🛡️ SUPER ADMIN HUB
// ==========================================
async function openAdminModal() {
  const token = getAuthToken();
  if (!token || !currentUser || currentUser.role !== 'ADMIN') return alert('Admin access only.');

  document.getElementById('adminModal').classList.remove('hidden');

  try {
    const res = await fetch(`${API_URL}/events/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await res.json();

    document.getElementById('admTotalEvents').innerText = stats.totalEvents || 0;
    document.getElementById('admTotalRegs').innerText = stats.totalRegistrations || 0;
    document.getElementById('admActivePasses').innerText = stats.activeConfirmed || 0;
    document.getElementById('admTotalUsers').innerText = stats.totalUsers || 0;
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

function closeAdminModal() {
  document.getElementById('adminModal').classList.add('hidden');
}

// ==========================================
// 🗑️ DELETE EVENT (CREATOR OR ADMIN)
// ==========================================
async function deleteEvent(eventId, eventTitle) {
  const token = getAuthToken();
  if (!token) return alert('Please sign in.');

  const roleText = currentUser.role === 'ADMIN' ? '(Super Admin Override)' : '';
  if (!confirm(`⚠️ Are you sure you want to permanently delete "${eventTitle}"? ${roleText}`)) return;

  try {
    const res = await fetch(`${API_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert('🗑️ ' + data.message);
    fetchEvents();
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}

// ==========================================
// 🌓 THEME TOGGLE
// ==========================================
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ==========================================
// 📅 TOP CALENDAR BOX GRAPHIC
// ==========================================
function renderCalendarGraphic(dateStr, category) {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const weekday = d.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return `
    <div class="relative w-full h-40 rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-[#18181b] dark:via-[#141416] dark:to-[#09090b] border border-zinc-200/80 dark:border-zinc-800 p-5 flex flex-col justify-between transition-colors">
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600"></div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">${month} SCHEDULE</span>
        </div>
        <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-0.5 bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-300 rounded-full border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
          ${category || 'General'}
        </span>
      </div>

      <div class="flex items-baseline gap-3 my-auto">
        <span class="text-4xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">${day < 10 ? '0' + day : day}</span>
        <div>
          <p class="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wider uppercase">${weekday}</p>
          <p class="text-[11px] font-mono text-zinc-500">${time}</p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Public Registration</span>
      </div>
    </div>
  `;
}

// ==========================================
// 1. FETCH & RENDER EVENTS
// ==========================================
async function fetchEvents() {
  const container = document.getElementById('eventsList');

  try {
    const res = await fetch(`${API_URL}/events`);
    allEvents = await res.json();
    checkUrlForSharedEvent();
    renderFilteredEvents();
  } catch (err) {
    container.innerHTML = `<div class="col-span-full text-center text-red-500 py-12 font-mono text-xs">Error loading events feed.</div>`;
  }
}

function checkUrlForSharedEvent() {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedEventId = urlParams.get('event');
  const banner = document.getElementById('sharedEventBanner');

  if (sharedEventId) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function clearSharedView() {
  window.history.pushState({}, document.title, window.location.pathname);
  checkUrlForSharedEvent();
  renderFilteredEvents();
}

function copyPublicLink(eventId, eventTitle) {
  const url = `${window.location.origin}/?event=${eventId}`;
  navigator.clipboard.writeText(url);
  alert(`📋 Copied Public Link for "${eventTitle}":\n\n${url}\n\nShare this link with anyone to present and register!`);
}

function handleSearch(val) {
  searchQuery = val.trim().toLowerCase();
  renderFilteredEvents();
}

function setFilter(category) {
  currentFilter = category.toUpperCase();
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('bg-white', 'text-zinc-900', 'dark:bg-white', 'dark:text-black', 'shadow-xs');
    btn.classList.add('text-zinc-600', 'dark:text-zinc-400');
  });

  const activeBtn = document.getElementById(`filter-${category}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-white', 'text-zinc-900', 'dark:bg-white', 'dark:text-black', 'shadow-xs');
    activeBtn.classList.remove('text-zinc-600', 'dark:text-zinc-400');
  }

  renderFilteredEvents();
}

function renderFilteredEvents() {
  const container = document.getElementById('eventsList');
  const urlParams = new URLSearchParams(window.location.search);
  const sharedEventId = urlParams.get('event');

  let filtered = allEvents;

  if (sharedEventId) {
    filtered = allEvents.filter(e => e._id === sharedEventId);
  } else {
    filtered = allEvents.filter(e => {
      const matchesCategory = currentFilter === 'ALL' || (e.category || '').toUpperCase() === currentFilter;
      const matchesSearch = !searchQuery || 
        (e.title && e.title.toLowerCase().includes(searchQuery)) ||
        (e.description && e.description.toLowerCase().includes(searchQuery)) ||
        (e.location && e.location.toLowerCase().includes(searchQuery)) ||
        (e.organizer && e.organizer.toLowerCase().includes(searchQuery));

      return matchesCategory && matchesSearch;
    });
  }

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full border border-dashed border-zinc-300 dark:border-zinc-800 p-12 rounded-3xl text-center bg-white/50 dark:bg-[#121215]/50">
        <h4 class="text-sm font-bold text-zinc-800 dark:text-zinc-200">No events found</h4>
        <p class="text-xs text-zinc-500 font-mono mt-1">Try tweaking your search or filters.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(e => {
    const isSoldOut = e.availableSeats <= 0;
    const price = e.price || 'Free';
    const organizer = e.organizer || 'CodeAlpha Events';
    const isOwner = currentUser && e.organizerId === currentUser.id;
    const isAdmin = currentUser && currentUser.role === 'ADMIN';
    const canManage = isOwner || isAdmin;

    const headerVisual = e.imageUrl 
      ? `
        <div class="relative w-full h-40 rounded-2xl overflow-hidden mb-4 bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <img src="${e.imageUrl}" alt="${e.title}" class="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition duration-500" onerror="this.onerror=null;this.parentElement.outerHTML=renderCalendarGraphic('${e.date}', '${e.category}');" />
          <div class="absolute top-3 right-3">
            <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 bg-black/75 backdrop-blur-md text-white rounded-full border border-white/10">
              ${e.category || 'General'}
            </span>
          </div>
        </div>
      `
      : renderCalendarGraphic(e.date, e.category);

    return `
      <div class="bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800/90 rounded-3xl p-5 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-600 shadow-xs hover:shadow-md transition duration-300">
        <div>
          ${headerVisual}

          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span class="truncate max-w-[140px]">${organizer}</span>
            </div>

            <div class="flex items-center gap-1.5">
              <button onclick="copyPublicLink('${e._id}', '${e.title.replace(/'/g, "\\'")}')" title="Copy Public Presentation Link" class="p-1 rounded-full text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </button>

              <span class="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                price.toLowerCase() === 'free' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                  : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
              }">
                ${price}
              </span>
            </div>
          </div>

          <h3 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5 leading-snug line-clamp-1">${e.title}</h3>
          <p class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed font-light mb-4">${e.description}</p>
        </div>

        <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              📍 <span class="truncate max-w-[100px] inline-block align-bottom">${e.location}</span>
            </p>
            <p class="text-xs font-bold mt-0.5 ${!isSoldOut ? 'text-zinc-900 dark:text-white' : 'text-red-500 font-mono'}">
              ${!isSoldOut ? `${e.availableSeats} / ${e.capacity} left` : 'SOLD OUT'}
            </p>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Delete Button (Only Owner or Admin) -->
            ${canManage ? `
              <button onclick="deleteEvent('${e._id}', '${e.title.replace(/'/g, "\\'")}')" title="Delete Event Permanently" class="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            ` : ''}

            <!-- Roster Button (Only Owner or Admin) -->
            ${canManage ? `
              <button onclick="viewAttendees('${e._id}', '${e.title.replace(/'/g, "\\'")}')" class="px-2.5 py-2 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition">
                Roster
              </button>
            ` : ''}

            <!-- Public Register Button -->
            <button 
              onclick="openRegisterModal('${e._id}', '${e.title.replace(/'/g, "\\'")}')"
              ${isSoldOut ? 'disabled' : ''}
              class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                !isSoldOut
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 shadow-sm'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
              }">
              ${!isSoldOut ? `
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
                </svg>
                <span>Pass</span>
              ` : '<span>Sold Out</span>'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 2. PUBLIC REGISTRATION
// ==========================================
function openRegisterModal(id, title) {
  document.getElementById('regEventId').value = id;
  document.getElementById('modalEventTitle').innerText = title;
  document.getElementById('registerModal').classList.remove('hidden');
}

function closeRegisterModal() {
  document.getElementById('registerModal').classList.add('hidden');
  document.getElementById('registerForm').reset();
}

async function handleRegister(e) {
  e.preventDefault();
  const payload = {
    eventId: document.getElementById('regEventId').value,
    userName: document.getElementById('regName').value,
    userEmail: document.getElementById('regEmail').value,
    userPhone: document.getElementById('regPhone').value
  };

  try {
    const res = await fetch(`${API_URL}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to register');

    alert('✦ ' + data.message);
    closeRegisterModal();
    fetchEvents();
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}

// ==========================================
// 3. ATTENDEE ROSTER VIEW
// ==========================================
async function viewAttendees(eventId, eventTitle) {
  const token = getAuthToken();
  if (!token) return alert('Please sign in.');

  document.getElementById('rosterEventTitle').innerText = `Roster: ${eventTitle}`;
  const list = document.getElementById('rosterList');
  list.innerHTML = '<p class="text-xs font-mono text-zinc-400 py-4 text-center">Loading attendee registry...</p>';
  document.getElementById('rosterModal').classList.remove('hidden');

  try {
    const res = await fetch(`${API_URL}/events/${eventId}/attendees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const attendees = await res.json();

    if (!attendees || attendees.length === 0) {
      list.innerHTML = '<p class="text-xs text-zinc-400 text-center py-4">No attendees registered yet.</p>';
      return;
    }

    list.innerHTML = attendees.map((a, i) => `
      <div class="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex justify-between items-center text-xs">
        <div>
          <p class="font-bold text-zinc-900 dark:text-white">${i + 1}. ${a.userName}</p>
          <p class="text-zinc-500 font-mono text-[10px]">${a.userEmail} &bull; ${a.userPhone}</p>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
          a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
        }">${a.status}</span>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-red-500 text-xs py-2">Error loading roster.</p>';
  }
}

function closeRosterModal() {
  document.getElementById('rosterModal').classList.add('hidden');
}

// ==========================================
// 4. CREATE EVENT (ORGANIZER OR ADMIN)
// ==========================================
function openCreateModal() {
  const token = getAuthToken();
  if (!token) {
    alert('🔒 Please sign in as Organizer or Admin to publish events.');
    openAuthModal('login');
    return;
  }
  document.getElementById('createEventModal').classList.remove('hidden');
}

function closeCreateModal() {
  document.getElementById('createEventModal').classList.add('hidden');
}

async function handleCreateEvent(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return alert('Please log in.');

  const payload = {
    title: document.getElementById('evTitle').value,
    description: document.getElementById('evDesc').value,
    organizer: document.getElementById('evOrganizer').value,
    price: document.getElementById('evPrice').value || 'Free',
    date: document.getElementById('evDate').value,
    location: document.getElementById('evLocation').value,
    capacity: Number(document.getElementById('evCapacity').value),
    category: document.getElementById('evCategory').value,
    imageUrl: document.getElementById('evImageUrl').value
  };

  try {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create event');

    alert('✦ Event published successfully!');
    closeCreateModal();
    document.getElementById('createEventForm').reset();
    fetchEvents();
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}

// ==========================================
// 5. MANAGE TICKETS (PUBLIC)
// ==========================================
function toggleManageModal() {
  document.getElementById('manageModal').classList.toggle('hidden');
}

async function fetchUserRegistrations() {
  const email = document.getElementById('searchEmail').value.trim();
  const list = document.getElementById('userRegistrationsList');
  if (!email) return alert('Please enter your email');

  list.innerHTML = '<p class="text-xs font-mono text-zinc-400 dark:text-zinc-500 py-4 text-center">Searching registry...</p>';

  try {
    const res = await fetch(`${API_URL}/registrations/user/${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      list.innerHTML = '<p class="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center font-mono">No active registrations found.</p>';
      return;
    }

    list.innerHTML = data.map(r => `
      <div class="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex justify-between items-center transition-colors">
        <div>
          <h4 class="font-bold text-xs text-zinc-900 dark:text-white">${r.event ? r.event.title : 'Event Unavailable'}</h4>
          <p class="text-[10px] font-mono text-zinc-500 mt-0.5">ID: ${r._id.slice(-6)} &bull; ${new Date(r.registrationDate).toLocaleDateString()}</p>
          <span class="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            r.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
          }">${r.status}</span>
        </div>

        ${r.status === 'CONFIRMED' ? `
          <button onclick="cancelRegistration('${r._id}')" class="text-[11px] font-mono text-red-600 dark:text-red-400 hover:opacity-80 border border-red-300 dark:border-red-900/50 px-3.5 py-1.5 rounded-full transition">
            Cancel Pass
          </button>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-red-500 text-xs py-2">Failed to query user registry.</p>';
  }
}

async function cancelRegistration(id) {
  if (!confirm('Are you sure you want to cancel this registration pass?')) return;

  try {
    const res = await fetch(`${API_URL}/registrations/${id}/cancel`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert('✦ Pass cancelled successfully.');
    fetchUserRegistrations();
    fetchEvents();
  } catch (err) {
    alert(err.message);
  }
}

// Initial Call
renderAuthNavbar();
fetchEvents();