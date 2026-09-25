const API_URL = '/api';
let allEvents = [];
let currentFilter = 'ALL';
let searchQuery = '';

// ==========================================
// 🌓 PILL THEME TOGGLE
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
        <span class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Registration Open</span>
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
    renderFilteredEvents();
  } catch (err) {
    container.innerHTML = `<div class="col-span-full text-center text-red-500 py-12 font-mono text-xs">Error loading events feed.</div>`;
  }
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

  const filtered = allEvents.filter(e => {
    const matchesCategory = currentFilter === 'ALL' || (e.category || '').toUpperCase() === currentFilter;
    const matchesSearch = !searchQuery || 
      (e.title && e.title.toLowerCase().includes(searchQuery)) ||
      (e.description && e.description.toLowerCase().includes(searchQuery)) ||
      (e.location && e.location.toLowerCase().includes(searchQuery)) ||
      (e.organizer && e.organizer.toLowerCase().includes(searchQuery));

    return matchesCategory && matchesSearch;
  });

  // Empty State
  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full border border-dashed border-zinc-300 dark:border-zinc-800 p-12 rounded-3xl text-center bg-white/50 dark:bg-[#121215]/50">
        <div class="w-12 h-12 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
          🔍
        </div>
        <h4 class="text-sm font-bold text-zinc-800 dark:text-zinc-200">No matching events found</h4>
        <p class="text-xs text-zinc-500 font-mono mt-1">Try tweaking your search terms or category filters.</p>
        <button onclick="openCreateModal()" class="mt-4 text-xs font-semibold px-4 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition">
          + Create An Event
        </button>
      </div>`;
    return;
  }

  // Render Cards
  container.innerHTML = filtered.map(e => {
    const isSoldOut = e.availableSeats <= 0;
    const price = e.price || 'Free';
    const organizer = e.organizer || 'CodeAlpha Events';

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
          <!-- Top Visual / Date graphic -->
          ${headerVisual}

          <!-- Organizer & Price Badges (No Duplicate Date) -->
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span class="truncate max-w-[160px]">${organizer}</span>
            </div>
            <span class="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
              price.toLowerCase() === 'free' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60'
                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
            }">
              ${price}
            </span>
          </div>

          <!-- Event Title -->
          <h3 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5 leading-snug line-clamp-1">${e.title}</h3>
          
          <!-- Clamped Description -->
          <p class="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed font-light mb-4">${e.description}</p>
        </div>

        <!-- Card Footer -->
        <div class="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <p class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
              📍 <span class="truncate max-w-[110px] sm:max-w-[130px]">${e.location}</span>
            </p>
            <p class="text-xs font-bold mt-0.5 ${!isSoldOut ? 'text-zinc-900 dark:text-white' : 'text-red-500 font-mono'}">
              ${!isSoldOut ? `${e.availableSeats} / ${e.capacity} seats left` : 'SOLD OUT'}
            </p>
          </div>

          <!-- Register / Sold Out Button with Lucide-style Ticket SVG -->
          <button 
            onclick="openRegisterModal('${e._id}', '${e.title.replace(/'/g, "\\'")}')"
            ${isSoldOut ? 'disabled' : ''}
            class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
              !isSoldOut
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 shadow-sm'
                : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
            }">
            ${!isSoldOut ? `
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
              <span>Register</span>
            ` : '<span>Sold Out</span>'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 2. REGISTRATION CONTROLS
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

    alert('' + data.message);
    closeRegisterModal();
    fetchEvents();
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}

// ==========================================
// 3. MANAGE TICKETS
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

    alert('Pass cancelled successfully.');
    fetchUserRegistrations();
    fetchEvents();
  } catch (err) {
    alert(err.message);
  }
}

//create event
function openCreateModal() { document.getElementById('createEventModal').classList.remove('hidden'); }
function closeCreateModal() { document.getElementById('createEventModal').classList.add('hidden'); }

async function handleCreateEvent(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('evTitle').value,
    description: document.getElementById('evDesc').value,
    organizer: document.getElementById('evOrganizer').value || 'CodeAlpha Events',
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to create event');

    alert('Event published successfully!');
    closeCreateModal();
    document.getElementById('createEventForm').reset();
    fetchEvents();
  } catch (err) {
    alert(err.message);
  }
}

// Initial Call
fetchEvents();