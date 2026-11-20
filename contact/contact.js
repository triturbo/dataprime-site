const addressLink = document.querySelector('.email-link');
const copyButton = document.querySelector('.copy-address');
const copyStatus = document.querySelector('.copy-status');

if (navigator.clipboard?.writeText) {
  document.querySelector('.contact-actions').hidden = false;
  copyButton.addEventListener('click', async () => {
    copyStatus.textContent = '';
    try {
      await navigator.clipboard.writeText(addressLink.getAttribute('href').slice('mailto:'.length));
      copyStatus.textContent = 'Address copied.';
    } catch {
      copyStatus.textContent = 'Copy unavailable. Select the address to copy it.';
    }
  });
}
