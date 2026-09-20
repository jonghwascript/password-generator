$(function () {
  const $slider = $('#length');
  const $lengthVal = $('#length-val');
  const $form = $('.form-password');
  const $uppercase = $('input[name=uppercase]');
  const $lowercase = $('input[name=lowercase]');
  const $numbers = $('input[name=numbers]');
  const $symbols = $('input[name=symbols]');
  const $copied = $('.password-copy');
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

  $form.on('submit', function (event) {
    // Prevent the default form submission from reloading the page.
    event.preventDefault();

    const groups = [];
    if ($uppercase.prop('checked')) groups.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if ($lowercase.prop('checked')) groups.push('abcdefghijklmnopqrstuvwxyz');
    if ($numbers.prop('checked')) groups.push('0123456789');
    if ($symbols.prop('checked')) groups.push('!@#$%^&*()_+~`|}{[]:;?><,./-=');

    const length = Number($slider.val());
    if (!Number.isInteger(length) || length < 1) {
      alert('Password length must be a whole number of at least 1.');
      return;
    }
    if (groups.length === 0) {
      // Use only lowercase letters when no options are selected.
      groups.push('abcdefghijklmnopqrstuvwxyz');
    }
    if (length < groups.length) {
      alert(
        `Password length must be at least ${groups.length} to include each selected character type.`,
      );
      return;
    }

    const password = generatePassword(length, groups);
    $('.password').text(password).addClass('active');
    updateStrength(password);
    copyRequest++;
    clearTimeout(copyTimer);
    $('.copied').removeClass('active');
  });

  $copied.on('click', async function () {
    const $password = $('.password');
    if (!$password.hasClass('active') || !$password.text()) {
      alert('Please generate a password first.');
      return;
    }

    const request = ++copyRequest;
    clearTimeout(copyTimer);
    $('.copied').removeClass('active');
    try {
      await navigator.clipboard.writeText($password.text());
      // Ignore stale results if a new password or copy request was created.
      if (request !== copyRequest) return;
      $('.copied').addClass('active');
      // Announce successful clipboard copying to screen readers.
      $('#copy-status').text('Password copied to clipboard.');
      copyTimer = setTimeout(() => $('.copied').removeClass('active'), 2000);
    } catch {
      if (request !== copyRequest) return;
      alert('Could not copy the password to the clipboard. Please check your browser permissions.');
    }
  });

  // These UI strength levels do not guarantee resistance to real attacks.
  function updateStrength(password) {
    const types = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(
      (pattern) => pattern.test(password),
    ).length;
    let level = 0;
    if (password.length >= 16 && types === 4) level = 3;
    else if (password.length >= 12 && types >= 3) level = 2;
    else if (password.length >= 8 && types >= 2) level = 1;

    const labels = ['TOO WEAK!', 'WEAK', 'MEDIUM', 'STRONG'];
    const colors = ['bg-red', 'bg-orange', 'bg-yello', 'bg-green'];
    $('.strength-value').text(labels[level]);
    $('.strength .box-strength')
      .removeClass('active bg-red bg-orange bg-yello bg-green')
      .slice(0, level + 1)
      .addClass(colors[level]);
  }

  // Select an index using cryptographic randomness without modulo bias.
  function randomIndex(max) {
    const range = 2 ** 32;
    const limit = range - (range % max);
    const values = new Uint32Array(1);
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
  }

  function generatePassword(length, groups) {
    const chars = groups.join('');
    // Include at least one character from each selected group.
    const password = groups.map((group) => group[randomIndex(group.length)]);
    while (password.length < length) {
      password.push(chars[randomIndex(chars.length)]);
    }

    // Use a Fisher–Yates shuffle to randomize required character positions.
    for (let i = password.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }
});
