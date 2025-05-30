// Drag-and-drop upload component for QuickDrop.ai
// Features: progress bar, file preview, type/size validation

const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
const maxSize = 500 * 1024 * 1024; // 500MB

function createDropzone(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="dropzone" id="dropzone">
      <p>Drag & drop your file here or <span class="browse">browse</span></p>
      <input type="file" id="fileInput" style="display:none" />
      <div class="preview" id="preview"></div>
      <div class="progress-bar" id="progressBar" style="display:none">
        <div class="progress" id="progress"></div>
      </div>
      <div class="error" id="error"></div>
    </div>
  `;

  const dropzone = container.querySelector('#dropzone');
  const fileInput = container.querySelector('#fileInput');
  const preview = container.querySelector('#preview');
  const progressBar = container.querySelector('#progressBar');
  const progress = container.querySelector('#progress');
  const error = container.querySelector('#error');
  const browse = container.querySelector('.browse');

  function reset() {
    preview.innerHTML = '';
    progressBar.style.display = 'none';
    progress.style.width = '0%';
    error.textContent = '';
  }

  function showError(msg) {
    error.textContent = msg;
  }

  function handleFiles(files) {
    reset();
    const file = files[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      showError('Invalid file type. Only JPG, PNG, MP4, MOV allowed.');
      return;
    }
    if (file.size > maxSize) {
      showError('File too large. Max 500MB allowed.');
      return;
    }
    // Preview
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = '200px';
      img.onload = () => URL.revokeObjectURL(img.src);
      preview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
      const vid = document.createElement('video');
      vid.src = URL.createObjectURL(file);
      vid.controls = true;
      vid.style.maxWidth = '200px';
      vid.onloadeddata = () => URL.revokeObjectURL(vid.src);
      preview.appendChild(vid);
    }
    // Simulate upload
    progressBar.style.display = 'block';
    let percent = 0;
    const interval = setInterval(() => {
      percent += 10;
      progress.style.width = percent + '%';
      if (percent >= 100) {
        clearInterval(interval);
        progress.style.width = '100%';
      }
    }, 100);
  }

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', e => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  browse.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => handleFiles(e.target.files));
}

// To use: call createDropzone('your-container-id') after DOM is loaded.
