// profile_edit.js
document.addEventListener('DOMContentLoaded', function () {
  const avatarInput = document.getElementById('id_avatar');
  const avatarPreview = document.getElementById('avatarPreview');
  const form = document.getElementById('editProfileForm');
  const saveBtn = document.getElementById('saveBtn');

  // preview avatar when a file is chosen
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', function (evt) {
      const file = evt.target.files && evt.target.files[0];
      if (!file) return;
      // validate image type (basic)
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        avatarInput.value = '';
        return;
      }
      // optional size check (2.5 MB)
      const maxBytes = 2.5 * 1024 * 1024;
      if (file.size > maxBytes) {
        alert('Image is too large (max 2.5MB).');
        avatarInput.value = '';
        return;
      }
      const url = URL.createObjectURL(file);
      avatarPreview.src = url;
    });
  }

  // simple client-side form feedback
  if (form && saveBtn) {
    form.addEventListener('submit', function (e) {
      // disable button to avoid duplicate submits
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.7';
      saveBtn.textContent = 'Saving...';
      saveBtn.classList.add('saving');   // 🔹 for animated state
    });
  }

  // accessibility: keyboard focus visible for inputs
  document.querySelectorAll('.input, textarea, select').forEach(el => {
    el.addEventListener('focus', () => el.classList.add('focused'));
    el.addEventListener('blur', () => el.classList.remove('focused'));
  });
});
