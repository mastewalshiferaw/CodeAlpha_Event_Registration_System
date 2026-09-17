const API_URL = '/api';


// FETCH & RENDER ALL EVENTS
async function fetchEvents() {
  const container = document.getElementById('eventsList');
  try {
    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="col-span-full bg-white p-8 rounded-xl text-center border border-dashed border-gray-300">
          <p class="text-gray-500">No events currently available.</p>
          <button onclick="openCreateModal()" class="mt-2 text-indigo-600 hover:underline text-sm font-medium">Create your first event</button>
        </div>`;
      return;
    }

    container.innerHTML = events.map(e => `
      <div class="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div class="flex justify-between items-start mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
              ${e.category || 'General'}
            </span>
            <span class="text-xs font-semibold ${e.availableSeats > 0 ? 'text-emerald-600' : 'text-red-600'}">
              ${e.availableSeats > 0 ? `${e.availableSeats} seats remaining` : 'SOLD OUT'}
            </span>
          </div>
          
          <h3 class="text-lg font-bold text-gray-900">${e.title}</h3>
          <p class="text-gray-600 text-sm mt-1 line-clamp-2">${e.description}</p>
          
          <div class="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p>📍 <strong class="text-gray-700">Location:</strong> ${e.location}</p>
            <p>📅 <strong class="text-gray-700">Date:</strong> ${new Date(e.date).toLocaleString()}</p>
            <p>👥 <strong class="text-gray-700">Total Capacity:</strong> ${e.capacity}</p>
          </div>
        </div>

        <button 
          onclick="openRegisterModal('${e._id}', '${e.title.replace(/'/g, "\\'")}')"
          ${e.availableSeats <= 0 ? 'disabled' : ''}
          class="mt-5 w-full py-2 px-4 rounded-lg text-sm font-semibold transition ${
            e.availableSeats > 0 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }">
          ${e.availableSeats > 0 ? 'Register Now' : 'Sold Out'}
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">Failed to load events.</div>`;
  }
}

//MODAL CONTROLS & EVENT CREATION

function openCreateModal() { document.getElementById('createEventModal').classList.remove('hidden'); }
function closeCreateModal() { document.getElementById('createEventModal').classList.add('hidden'); }

async function handleCreateEvent(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('evTitle').value,
    description: document.getElementById('evDesc').value,
    date: document.getElementById('evDate').value,
    location: document.getElementById('evLocation').value,
    capacity: Number(document.getElementById('evCapacity').value),
    category: document.getElementById('evCategory').value || 'General'
  };

  try {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error('Failed to create event');
    
    alert('🎉 Event created successfully!');
    closeCreateModal();
    document.getElementById('createEventForm').reset();
    fetchEvents();
  } catch (err) {
    alert(err.message);
  }
}

// Registration logo
function openRegisterModal(id, title) {
  document.getElementById('regEventId').value = id;
  document.getElementById('modalEventTitle').innerText = `Register for: ${title}`;
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
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    alert('✅ ' + data.message);
    closeRegisterModal();
    fetchEvents(); // Refresh seats count on the main page
  } catch (err) {
    alert('⚠️ ' + err.message);
  }
}


// USER REGISTRATIONS & CANCELLATION

function toggleManageModal() {
  document.getElementById('manageModal').classList.toggle('hidden');
}

async function fetchUserRegistrations() {
  const email = document.getElementById('searchEmail').value.trim();
  const list = document.getElementById('userRegistrationsList');
  if (!email) return alert('Please enter your email');

  list.innerHTML = '<p class="text-xs text-gray-500">Searching...</p>';

  try {
    const res = await fetch(`${API_URL}/registrations/user/${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      list.innerHTML = '<p class="text-sm text-gray-500 py-2">No registrations found for this email.</p>';
      return;
    }

    list.innerHTML = data.map(r => `
      <div class="border border-gray-200 p-3.5 rounded-lg flex justify-between items-center bg-gray-50">
        <div>
          <h4 class="font-bold text-sm text-gray-900">${r.event ? r.event.title : 'Event Unavailable'}</h4>
          <p class="text-xs text-gray-500 mt-0.5">Booked on: ${new Date(r.registrationDate).toLocaleDateString()}</p>
          <span class="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded ${
            r.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }">${r.status}</span>
        </div>

        ${r.status === 'CONFIRMED' ? `
          <button onclick="cancelRegistration('${r._id}')" class="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-md font-semibold transition">
            Cancel
          </button>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-red-500 text-xs">Error fetching registrations.</p>';
  }
}

async function cancelRegistration(id) {
  if (!confirm('Are you sure you want to cancel this registration?')) return;

  try {
    const res = await fetch(`${API_URL}/registrations/${id}/cancel`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    alert('✅ Registration cancelled');
    fetchUserRegistrations(); 
    fetchEvents();           
  } catch (err) {
    alert(err.message);
  }
}

// Initial fetch on page load
fetchEvents();