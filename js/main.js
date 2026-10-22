// Page behavior. The password rules (CHARACTER_GROUPS, validateSettings, generatePassword,
// getStrengthLevel) come from password.js, which is loaded first.

$(function () {
  const $slider = $('#length');
  const $lengthVal = $('#length-val');
  const $form = $('#password-form');
  const $copyButton = $('#copy-button');
  let copyTimer;
  let copyRequest = 0;

  function updateSliderBackground(e) {
    const $target = e ? $(e.currentTarget) : $slider;
    const value = Number($target.val());
    const min = Number($target.attr('min') ?? 0);
    const max = Number($target.attr('max') ?? 100);

    // Calculate the current value as a percentage of the slider range.
    const percentage = ((value - min) / (max - min)) * 100;

    // Set the --progress CSS custom property on the input element.
    $target.css('--progress', `${percentage}%`);

    // Update the displayed length in real time.
    $lengthVal.text(value);
  }

  // Initialize the slider background and displayed length on page load.
  updateSliderBackground();

  // Update the slider background and length whenever the input changes.
  $slider.on('input', updateSliderBackground);

  // Read the form controls into plain settings for the password rules.
  function readSettings() {
    return {
      length: Number($slider.val()),
      types: Object.keys(CHARACTER_GROUPS).filter((type) =>
        $form.find(`input[name=${type}]`).prop('checked'),
      ),
    };
  }

  // Invalidate pending copy results and hide the current confirmation.
  // Returns the new request id so a copy can detect whether it is still current.
  function resetCopyFeedback() {
    copyRequest++;
    clearTimeout(copyTimer);
    $('#copied').removeClass('is-visible');
    // Clear the status so the next message is a change that screen readers announce again.
    $('#copy-status').text('');
    return copyRequest;
  }

  function showPassword(password) {
    $('#password').text(password).addClass('is-generated');
    updateStrength(password);
    resetCopyFeedback();
  }

  $form.on('submit', function (event) {
    // Prevent the default form submission from reloading the page.
    event.preventDefault();

    const settings = readSettings();
    const error = validateSettings(settings);
    if (error) {
      alert(error);
      return;
    }

    const groups = settings.types.map((type) => CHARACTER_GROUPS[type]);
    showPassword(generatePassword(settings.length, groups));
  });

  $copyButton.on('click', async function () {
    const $password = $('#password');
    if (!$password.hasClass('is-generated') || !$password.text()) {
      alert('Please generate a password first.');
      return;
    }

    const request = resetCopyFeedback();
    try {
      await navigator.clipboard.writeText($password.text());
      // Ignore stale results if a new password or copy request was created.
      if (request !== copyRequest) return;
      $('#copied').addClass('is-visible');
      // Announce successful clipboard copying to screen readers.
      $('#copy-status').text('Password copied to clipboard.');
      copyTimer = setTimeout(() => $('#copied').removeClass('is-visible'), 2000);
    } catch {
      if (request !== copyRequest) return;
      alert('Could not copy the password to the clipboard. Please check your browser permissions.');
    }
  });

  // These UI strength levels do not guarantee resistance to real attacks.
  function updateStrength(password) {
    const level = getStrengthLevel(password);

    const labels = ['TOO WEAK!', 'WEAK', 'MEDIUM', 'STRONG'];
    // State classes read by .c-strength; the level sets the color of the filled bars.
    const states = ['is-too-weak', 'is-weak', 'is-medium', 'is-strong'];
    $('#strength-value').text(labels[level]);
    $('#strength').removeClass(states.join(' ')).addClass(states[level]);
    $('#strength-bars')
      .children()
      .removeClass('is-filled')
      .slice(0, level + 1)
      .addClass('is-filled');
  }
});
